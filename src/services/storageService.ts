import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const Storage = {
  upload(
    file: File,
    name: string,
    onSuccess: (url: string) => void,
    onError?: (error: Error) => void,
    onProgress?: (progress: number) => void
  ) {
    const firebaseConfig = {
      apiKey:
        import.meta.env.VITE_FB_API_KEY_2 || import.meta.env.VITE_FB_API_KEY,
      authDomain:
        import.meta.env.VITE_FB_AUTH_DOMAIN_2 ||
        import.meta.env.VITE_FB_AUTH_DOMAIN,
      projectId:
        import.meta.env.VITE_FB_PROJECT_ID_2 ||
        import.meta.env.VITE_FB_PROJECT_ID,
      storageBucket:
        import.meta.env.VITE_FB_STORAGE_BUCKET_2 ||
        import.meta.env.VITE_FB_STORAGE_BUCKET,
      messagingSenderId:
        import.meta.env.VITE_FB_MESSAGING_SENDER_ID_2 ||
        import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FB_APP_ID_2 || import.meta.env.VITE_FB_APP_ID,
      measurementId:
        import.meta.env.VITE_FB_MEASUREMENT_ID_2 ||
        import.meta.env.VITE_FB_MEASUREMENT_ID,
    };

    const app = initializeApp(firebaseConfig, "storage");

    const storage = getStorage(app);
    const storageRef = ref(storage, `images/${name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        if (onError) {
          onError(error);
        }
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        onSuccess(url);
      }
    );
  },

  uploadAsync(file: File, name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.upload(
        file,
        name,
        (url: string) => {
          resolve(url);
        },
        (error: Error) => {
          reject(error);
        }
      );
    });
  },
};

export default Storage;
