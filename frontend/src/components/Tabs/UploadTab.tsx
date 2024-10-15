import React, { useState } from 'react';
import { Button } from "../ui/Button";
import { ChevronLeft } from 'lucide-react';
import DiseaseOptions from '../DiseaseOptions';
import UploadImage from '../UploadImage';
import Chat from '../Chat';
import axios from 'axios';

const UploadTab = () => {
  const [uploadStep, setUploadStep] = useState(0);
  const [imageType, setImageType] = useState<'skin' | 'eye' | 'nail' | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; isAI: boolean }>>([]);
  const [loading, setLoading] = useState(false); // Loading state for AI analysis


  const handleBack = () => {
    if (uploadStep > 0) setUploadStep((prev) => prev - 1);
  };

  const handleImageTypeSelect = async (type: 'skin' | 'eye' | 'nail') => {
    setImageType(type);
    setUploadStep(1);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://backend-health-lens.vercel.app/user/increment-scans', 
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error incrementing scans:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setUploadStep(2);
    setLoading(true);
    setChatMessages([{ text: `Analyzing your ${imageType} image...`, isAI: true }]);

    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', imageType!);

    let apiUrl;
    switch (imageType) {
      case 'eye':
        apiUrl = 'https://flask-service-healthlens.onrender.com/predict/cataracts';
        break;
      case 'nail':
        apiUrl = 'https://flask-service-healthlens.onrender.com/predict/nails';
        break;
      case 'skin':
        apiUrl = 'https://flask-service-healthlens.onrender.com/predict/skin';
        break;
      default:
        return;
    }

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Prediction result:', response);

      const prediction = response.data.prediction;
      setChatMessages(prev => [
        ...prev,
        { text: `Prediction result: ${prediction}. Let's discuss your condition in more detail.`, isAI: true },
      ]);
    } catch (error) {
      console.error('Error uploading image:', error);
      setChatMessages(prev => [
        ...prev,
        { text: 'There was an error uploading the image. Please try again.', isAI: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {uploadStep === 0 && (
        <DiseaseOptions onImageTypeSelect={handleImageTypeSelect} fromDashboard={true} />
      )}
      {uploadStep === 1 && (
        <>
          <UploadImage imageType={imageType} onImageUpload={handleImageUpload} />
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex items-center space-x-2 bg-white bg-opacity-50 backdrop-blur-md hover:bg-opacity-75 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </>
      )}
      {uploadStep === 2 && (
        <>
          <Chat
            chatMessages={chatMessages}
            onSendMessage={() => {}}
            imageType={imageType}
            uploadedImageUrl={uploadedImageUrl}
          />
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex items-center space-x-2 bg-white bg-opacity-50 backdrop-blur-md hover:bg-opacity-75 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </>
      )}
    </div>
  );
};

export default UploadTab;