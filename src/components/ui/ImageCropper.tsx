import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'

import {
  Check,
  ImageIcon,
  RotateCcw,
  X,
} from 'lucide-react'

import './ImageCropper.css'

type CropShape =
  | 'square'
  | 'circle'

type ImageCropperProps = {
  file: File
  title: string
  description?: string
  cropShape?: CropShape
  outputSize?: number
  confirmLabel?: string
  onCancel: () => void
  onConfirm: (
    file: File,
  ) => Promise<void>
}

type ImageDimensions = {
  width: number
  height: number
}

type ImageOffset = {
  x: number
  y: number
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

const PREVIEW_SIZE =
  600

const CROP_INSET_RATIO =
  0.08

const CROP_START =
  PREVIEW_SIZE *
  CROP_INSET_RATIO

const CROP_SIZE =
  PREVIEW_SIZE -
  CROP_START * 2

const DEFAULT_OUTPUT_SIZE =
  900

const MIN_ZOOM =
  0.35

const DEFAULT_ZOOM =
  1

const MAX_ZOOM =
  4

const MAX_OFFSET =
  PREVIEW_SIZE *
  0.75

function clamp(
  value: number,
  min: number,
  max: number,
) {
  return Math.min(
    Math.max(
      value,
      min,
    ),
    max,
  )
}

function getBaseScale(
  dimensions: ImageDimensions,
) {
  return Math.min(
    CROP_SIZE /
      dimensions.width,

    CROP_SIZE /
      dimensions.height,
  )
}

function getRenderedSize(
  dimensions: ImageDimensions,
  zoom: number,
) {
  const scale =
    getBaseScale(
      dimensions,
    ) *
    zoom

  return {
    scale,

    width:
      dimensions.width *
      scale,

    height:
      dimensions.height *
      scale,
  }
}

function getImagePosition(
  dimensions: ImageDimensions,
  zoom: number,
  offset: ImageOffset,
) {
  const rendered =
    getRenderedSize(
      dimensions,
      zoom,
    )

  return {
    rendered,

    x:
      (
        PREVIEW_SIZE -
        rendered.width
      ) /
        2 +
      offset.x,

    y:
      (
        PREVIEW_SIZE -
        rendered.height
      ) /
        2 +
      offset.y,
  }
}

function drawAdjustedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  dimensions: ImageDimensions,
  zoom: number,
  offset: ImageOffset,
) {
  const {
    rendered,
    x,
    y,
  } =
    getImagePosition(
      dimensions,
      zoom,
      offset,
    )

  context.clearRect(
    0,
    0,
    PREVIEW_SIZE,
    PREVIEW_SIZE,
  )

  context.drawImage(
    image,
    x,
    y,
    rendered.width,
    rendered.height,
  )
}

function getOutputFormat() {
  return {
    mimeType:
      'image/webp',

    extension:
      'webp',
  }
}

function getOutputFileName(
  file: File,
  extension: string,
) {
  const baseName =
    file.name
      .replace(
        /\.[^/.]+$/,
        '',
      )
      .trim() ||
    'imagem'

  return `${baseName}-ajustada.${extension}`
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
): Promise<Blob> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                'Não foi possível preparar a imagem.',
              ),
            )

            return
          }

          resolve(
            blob,
          )
        },
        mimeType,
        0.92,
      )
    },
  )
}

export function ImageCropper({
  file,
  title,
  description,
  cropShape =
    'square',
  outputSize =
    DEFAULT_OUTPUT_SIZE,
  confirmLabel =
    'Usar imagem',
  onCancel,
  onConfirm,
}: ImageCropperProps) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    )

  const imageRef =
    useRef<HTMLImageElement | null>(
      null,
    )

  const dragRef =
    useRef<DragState | null>(
      null,
    )

  const [
    dimensions,
    setDimensions,
  ] = useState<ImageDimensions | null>(
    null,
  )

  const [
    zoom,
    setZoom,
  ] = useState(
    DEFAULT_ZOOM,
  )

  const [
    offset,
    setOffset,
  ] = useState<ImageOffset>({
    x: 0,
    y: 0,
  })

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  )

  const [
    processing,
    setProcessing,
  ] = useState(
    false,
  )

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  useEffect(() => {
    setLoading(
      true,
    )

    setError(
      null,
    )

    setDimensions(
      null,
    )

    setZoom(
      DEFAULT_ZOOM,
    )

    setOffset({
      x: 0,
      y: 0,
    })

    imageRef.current =
      null

    const objectUrl =
      URL.createObjectURL(
        file,
      )

    const image =
      new Image()

    image.decoding =
      'async'

    image.onload =
      () => {
        imageRef.current =
          image

        setDimensions({
          width:
            image.naturalWidth,

          height:
            image.naturalHeight,
        })

        setError(
          null,
        )

        setLoading(
          false,
        )
      }

    image.onerror =
      () => {
        imageRef.current =
          null

        setDimensions(
          null,
        )

        setError(
          'Não foi possível abrir esta imagem.',
        )

        setLoading(
          false,
        )
      }

    image.src =
      objectUrl

    return () => {
      image.onload =
        null

      image.onerror =
        null

      URL.revokeObjectURL(
        objectUrl,
      )

      imageRef.current =
        null
    }
  }, [
    file,
  ])

  useEffect(() => {
    const canvas =
      canvasRef.current

    const image =
      imageRef.current

    if (
      !canvas ||
      !image ||
      !dimensions
    ) {
      return
    }

    const context =
      canvas.getContext(
        '2d',
      )

    if (!context) {
      return
    }

    drawAdjustedImage(
      context,
      image,
      dimensions,
      zoom,
      offset,
    )
  }, [
    dimensions,
    offset,
    zoom,
  ])

  function handlePointerDown(
    event: PointerEvent<HTMLCanvasElement>,
  ) {
    if (
      !dimensions ||
      processing
    ) {
      return
    }

    event.currentTarget.setPointerCapture(
      event.pointerId,
    )

    dragRef.current = {
      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      offsetX:
        offset.x,

      offsetY:
        offset.y,
    }
  }

  function handlePointerMove(
    event: PointerEvent<HTMLCanvasElement>,
  ) {
    const drag =
      dragRef.current

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return
    }

    const rect =
      event.currentTarget.getBoundingClientRect()

    if (
      rect.width <=
      0 ||
      rect.height <=
      0
    ) {
      return
    }

    const horizontalScale =
      PREVIEW_SIZE /
      rect.width

    const verticalScale =
      PREVIEW_SIZE /
      rect.height

    const deltaX =
      (
        event.clientX -
        drag.startX
      ) *
      horizontalScale

    const deltaY =
      (
        event.clientY -
        drag.startY
      ) *
      verticalScale

    setOffset({
      x:
        clamp(
          drag.offsetX +
            deltaX,
          -MAX_OFFSET,
          MAX_OFFSET,
        ),

      y:
        clamp(
          drag.offsetY +
            deltaY,
          -MAX_OFFSET,
          MAX_OFFSET,
        ),
    })
  }

  function finishDragging(
    event: PointerEvent<HTMLCanvasElement>,
  ) {
    if (
      dragRef.current?.pointerId !==
      event.pointerId
    ) {
      return
    }

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      )
    }

    dragRef.current =
      null
  }

  function handleReset() {
    setZoom(
      DEFAULT_ZOOM,
    )

    setOffset({
      x: 0,
      y: 0,
    })
  }

  async function handleConfirm() {
    const image =
      imageRef.current

    if (
      !image ||
      !dimensions
    ) {
      setError(
        'A imagem ainda não está pronta para ser salva.',
      )

      return
    }

    try {
      setProcessing(
        true,
      )

      setError(
        null,
      )

      const previewCanvas =
        document.createElement(
          'canvas',
        )

      previewCanvas.width =
        PREVIEW_SIZE

      previewCanvas.height =
        PREVIEW_SIZE

      const previewContext =
        previewCanvas.getContext(
          '2d',
        )

      if (!previewContext) {
        throw new Error(
          'Não foi possível preparar a imagem.',
        )
      }

      drawAdjustedImage(
        previewContext,
        image,
        dimensions,
        zoom,
        offset,
      )

      const outputCanvas =
        document.createElement(
          'canvas',
        )

      outputCanvas.width =
        outputSize

      outputCanvas.height =
        outputSize

      const outputContext =
        outputCanvas.getContext(
          '2d',
        )

      if (!outputContext) {
        throw new Error(
          'Não foi possível preparar a imagem final.',
        )
      }

      outputContext.clearRect(
        0,
        0,
        outputSize,
        outputSize,
      )

      outputContext.drawImage(
        previewCanvas,
        CROP_START,
        CROP_START,
        CROP_SIZE,
        CROP_SIZE,
        0,
        0,
        outputSize,
        outputSize,
      )

      const {
        mimeType,
        extension,
      } =
        getOutputFormat()

      const blob =
        await canvasToBlob(
          outputCanvas,
          mimeType,
        )

      const adjustedFile =
        new File(
          [
            blob,
          ],
          getOutputFileName(
            file,
            extension,
          ),
          {
            type:
              mimeType,
          },
        )

      await onConfirm(
        adjustedFile,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível ajustar a imagem.'

      setError(
        message,
      )
    } finally {
      setProcessing(
        false,
      )
    }
  }

  return (
    <div
      className="image-cropper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="imageCropperTitle"
    >
      <div className="image-cropper__panel">
        <header className="image-cropper__header">
          <div>
            <span>
              Ajuste de imagem
            </span>

            <h2 id="imageCropperTitle">
              {title}
            </h2>

            {description && (
              <p>
                {description}
              </p>
            )}
          </div>

          <button
            className="image-cropper__close"
            type="button"
            onClick={
              onCancel
            }
            disabled={
              processing
            }
            aria-label="Fechar ajuste"
          >
            <X
              size={19}
            />
          </button>
        </header>

        <div className="image-cropper__body">
          <div
            className={`image-cropper__viewport image-cropper__viewport--${cropShape}`}
          >
            {loading && (
              <div className="image-cropper__loading">
                <ImageIcon
                  size={24}
                />

                <span>
                  Preparando imagem...
                </span>
              </div>
            )}

            <canvas
              ref={
                canvasRef
              }
              className="image-cropper__canvas"
              width={
                PREVIEW_SIZE
              }
              height={
                PREVIEW_SIZE
              }
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                finishDragging
              }
              onPointerCancel={
                finishDragging
              }
              aria-label="Área de ajuste da imagem. Arraste para reposicionar."
            />
          </div>

          <p className="image-cropper__hint">
            Tudo que ficar dentro da marcação será usado. Arraste para
            reposicionar e ajuste o zoom se necessário.
          </p>

          <div className="image-cropper__controls">
            <div className="image-cropper__zoom">
              <label htmlFor="imageCropperZoom">
                Zoom
              </label>

              <input
                id="imageCropperZoom"
                type="range"
                min={
                  MIN_ZOOM
                }
                max={
                  MAX_ZOOM
                }
                step="0.01"
                value={
                  zoom
                }
                onChange={(
                  event,
                ) =>
                  setZoom(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                disabled={
                  loading ||
                  processing
                }
              />

              <span>
                {Math.round(
                  zoom *
                    100,
                )}
                %
              </span>
            </div>

            <button
              className="image-cropper__reset"
              type="button"
              onClick={
                handleReset
              }
              disabled={
                loading ||
                processing
              }
            >
              <RotateCcw
                size={15}
              />

              Centralizar
            </button>
          </div>

          {error && (
            <div className="image-cropper__error">
              {error}
            </div>
          )}
        </div>

        <footer className="image-cropper__actions">
          <button
            className="image-cropper__cancel"
            type="button"
            onClick={
              onCancel
            }
            disabled={
              processing
            }
          >
            Cancelar
          </button>

          <button
            className="image-cropper__confirm"
            type="button"
            onClick={
              handleConfirm
            }
            disabled={
              loading ||
              processing ||
              !dimensions
            }
          >
            <Check
              size={16}
            />

            {processing
              ? 'Salvando...'
              : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}