import PhotoGallery from "./components/PhotoGallery";
import Title from "antd/es/typography/Title";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto">
        <div className="text-center py-8">
          <Title>Photo Gallery - AWS S3 + DynamoDB</Title>
        </div>
        <PhotoGallery />
      </main>
    </div>
  );
}
