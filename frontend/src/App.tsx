import { Sidebar } from './components/Sidebar';
import { ImageGallery } from './components/ImageGallery';
import { useUpload } from './hooks/useUpload';
import { useImages } from './hooks/useImages';

function App() {
  const { images, accepted, rejected, loading, refresh } = useImages();
  const { uploads, upload, clearUploads } = useUpload(refresh);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        onUpload={upload}
        uploads={uploads}
        onClear={clearUploads}
        totalImages={images.length}
        acceptedCount={accepted.length}
        rejectedCount={rejected.length}
      />

      <main className="flex-1 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto p-8">
          <ImageGallery
            accepted={accepted}
            rejected={rejected}
            loading={loading}
            onRefresh={refresh}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
