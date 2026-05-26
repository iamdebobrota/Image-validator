import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import * as path from 'path';

let modelsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const modelsPath = path.join(__dirname, '..', '..', 'models');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
    modelsLoaded = true;
    console.log('Face detection models loaded');
  })();

  return loadPromise;
}

export interface FaceDetectionResult {
  faceCount: number;
  faceAreaRatio: number | null;
}

export async function detectFaces(buffer: Buffer): Promise<FaceDetectionResult> {
  await loadModels();

  const tensor = tf.node.decodeImage(buffer, 3);

  try {
    const detections = await faceapi.detectAllFaces(
      tensor as any,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
    );

    const faceCount = detections.length;

    if (faceCount === 0) {
      return { faceCount: 0, faceAreaRatio: null };
    }

    const [imgHeight, imgWidth] = tensor.shape.slice(0, 2);
    const imageArea = imgWidth * imgHeight;

    const largestFace = detections.reduce((max, d) =>
      d.box.width * d.box.height > max.box.width * max.box.height ? d : max
    );

    const faceArea = largestFace.box.width * largestFace.box.height;
    const faceAreaRatio = faceArea / imageArea;

    return { faceCount, faceAreaRatio };
  } finally {
    tensor.dispose();
  }
}
