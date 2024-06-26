import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Upload = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:3002/upload-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }

      const data = await response.json();
      console.log("File uploaded successfully:", data);
      alert("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Sending Bulk Messages</h1>
      <div className="mb-3">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="form-control"
        />
      </div>
      <button onClick={handleFileUpload} className="btn btn-primary w-100">
        Upload
      </button>
    </div>
  );
};

export default Upload;
