import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Upload page has been removed — redirect to dashboard
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return null;
};

export default UploadPage;
