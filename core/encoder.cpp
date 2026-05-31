#include "config.h"
#include <emscripten.h>
#include <stdint.h>

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <vector>

extern "C" {
#include <lcdfgif/gif.h>
#include <libimagequant.h>
}

static std::vector<uint8_t> outputBuffer;

static Gif_Colormap *create_colormap_from_palette(const liq_palette *palette) {
  Gif_Colormap *colormap = Gif_NewFullColormap(palette->count, palette->count);

  for (int i = 0; i < palette->count; i++) {
    colormap->col[i].pixel = i;
    colormap->col[i].gfc_red = palette->entries[i].r;
    colormap->col[i].gfc_green = palette->entries[i].g;
    colormap->col[i].gfc_blue = palette->entries[i].b;
    colormap->col[i].haspixel = 1;
  }

  return colormap;
}

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  uint8_t *process_frames(
      uint8_t *allFrames,
      int frameCount,
      int width,
      int height,
      int delay,
      int *outSize
  ) {
    const int frameSize = width * height * 4;

    outputBuffer.clear();
    *outSize = 0;

    liq_attr *attr = liq_attr_create();

    liq_set_max_colors(attr, 256);
    liq_set_quality(attr, 90, 100);

    liq_image *globalImage =
        liq_image_create_rgba(attr, allFrames, width, height * frameCount, 0);
    liq_result *quantResult = liq_quantize_image(attr, globalImage);
    const liq_palette *palette = liq_get_palette(quantResult);

    Gif_Colormap *colormap = create_colormap_from_palette(palette);
    Gif_Stream *stream = Gif_NewStream();

    stream->screen_width = width;
    stream->screen_height = height;
    stream->loopcount = 0;
    stream->global = colormap;

    Gif_CompressInfo compressInfo;
    Gif_InitCompressInfo(&compressInfo);
    compressInfo.loss = 20;

    std::vector<uint8_t> previousFrame(frameSize, 0);

    for (int frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      uint8_t *rgba = allFrames + (frameIndex * frameSize);

      int minX = width;
      int minY = height;
      int maxX = 0;
      int maxY = 0;
      bool changed = false;

      if (frameIndex == 0) {
        minX = 0;
        minY = 0;
        maxX = width - 1;
        maxY = height - 1;
        changed = true;
      } else {
        for (int y = 0; y < height; y++) {
          for (int x = 0; x < width; x++) {
            int i = (y * width + x) * 4;

            if (rgba[i] != previousFrame[i] ||
                rgba[i + 1] != previousFrame[i + 1] ||
                rgba[i + 2] != previousFrame[i + 2] ||
                rgba[i + 3] != previousFrame[i + 3]) {
              changed = true;
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }
      }

      if (!changed) {
        continue;
      }

      int diffWidth = (maxX - minX) + 1;
      int diffHeight = (maxY - minY) + 1;

      std::vector<uint8_t> patchRGBA(diffWidth * diffHeight * 4);

      for (int y = 0; y < diffHeight; y++) {
        int srcY = minY + y;

        memcpy(
            patchRGBA.data() + (y * diffWidth * 4),
            rgba + ((srcY * width + minX) * 4),
            diffWidth * 4
        );
      }

      liq_image *frameImage = liq_image_create_rgba(
          attr,
          patchRGBA.data(),
          diffWidth,
          diffHeight,
          0
      );

      std::vector<uint8_t> indexed(diffWidth * diffHeight);

      liq_write_remapped_image(
          quantResult,
          frameImage,
          indexed.data(),
          indexed.size()
      );

      uint8_t *gifData = Gif_NewArray(uint8_t, indexed.size());
      memcpy(gifData, indexed.data(), indexed.size());

      Gif_Image *image = Gif_NewImage();

      image->left = minX;
      image->top = minY;
      image->width = diffWidth;
      image->height = diffHeight;
      image->delay = delay;
      image->disposal = GIF_DISPOSAL_ASIS;
      image->transparent = -1;
      image->local = nullptr;

      Gif_SetUncompressedImage(image, gifData, Gif_Free, 0);
      Gif_FullCompressImage(stream, image, &compressInfo);

      Gif_AddImage(stream, image);

      liq_image_destroy(frameImage);

      memcpy(previousFrame.data(), rgba, frameSize);
    }

    const char *tempFile = "/output.gif";
    FILE *fp = fopen(tempFile, "wb");

    if (!fp) {
      Gif_DeleteStream(stream);
      liq_result_destroy(quantResult);
      liq_image_destroy(globalImage);
      liq_attr_destroy(attr);
      return nullptr;
    }

    Gif_FullWriteFile(stream, &compressInfo, fp);
    fclose(fp);

    fp = fopen(tempFile, "rb");

    if (!fp) {
      Gif_DeleteStream(stream);
      liq_result_destroy(quantResult);
      liq_image_destroy(globalImage);
      liq_attr_destroy(attr);
      return nullptr;
    }

    fseek(fp, 0, SEEK_END);
    long fileSize = ftell(fp);
    rewind(fp);

    outputBuffer.resize(fileSize);
    fread(outputBuffer.data(), 1, fileSize, fp);
    fclose(fp);
    remove(tempFile);

    *outSize = (int)outputBuffer.size();

    Gif_DeleteStream(stream);
    liq_result_destroy(quantResult);
    liq_image_destroy(globalImage);
    liq_attr_destroy(attr);

    return outputBuffer.data();
  }
}