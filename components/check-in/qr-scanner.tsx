"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, StopCircle, RefreshCw } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  isScanning: boolean
  setIsScanning: (isScanning: boolean) => void
}

export function QRScanner({ onScan, isScanning, setIsScanning }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt")
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fallbackMode, setFallbackMode] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "qr-reader"

  useEffect(() => {
    // Initialize the scanner when the component mounts
    scannerRef.current = new Html5Qrcode(scannerContainerId)

    // Clean up the scanner when the component unmounts
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Error stopping scanner", err))
      }
    }
  }, [])

  // We don't check permissions on mount anymore - we'll do it when the user clicks the start button

  // Fallback method to get cameras using navigator.mediaDevices.enumerateDevices()
  const getFallbackCameras = async () => {
    console.log("Using fallback method to get cameras");
    try {
      setFallbackMode(true);

      // Get all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Filter for video input devices (cameras)
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log("Fallback method found cameras:", videoDevices.length);

      if (videoDevices.length > 0) {
        // Transform to the format expected by the component
        const cameras = videoDevices.map(device => ({
          id: device.deviceId,
          label: device.label || `Camera ${videoDevices.indexOf(device) + 1}`
        }));

        setAvailableCameras(cameras);
        setSelectedCamera(cameras[0].id);
        setPermissionState("granted");
        return true;
      } else {
        setError("No cameras found on this device");
        return false;
      }
    } catch (err: any) {
      console.error("Error in fallback camera enumeration", err);
      setError("Failed to access camera: " + err.message);
      return false;
    }
  };

  const getCameras = async () => {
    try {
      setIsLoading(true)
      setFallbackMode(false)

      // Check if we're in a secure context (HTTPS)
      if (!window.isSecureContext) {
        setError("Camera access requires a secure connection (HTTPS). Please use HTTPS to access this page.");
        return false;
      }

      // Check if mediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Your browser doesn't support camera access. Please try a different browser.");
        return false;
      }

      // Try a different approach for requesting permissions
      // First, request camera permission only
      try {
        console.log("Requesting camera permission first...");
        await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        console.log("Camera permission granted successfully");

        // Then, try to request microphone permission
        try {
          console.log("Now requesting microphone permission...");
          await navigator.mediaDevices.getUserMedia({ 
            audio: true 
          });
          console.log("Microphone permission granted successfully");
        } catch (micErr: any) {
          // It's okay if microphone permission fails, we can still proceed with camera only
          console.log("Microphone permission denied, but we can continue with camera only");
          console.log("MicError name:", micErr.name);
          console.log("MicError message:", micErr.message);
        }
      } catch (cameraErr: any) {
        console.error("Error requesting camera permission", cameraErr);
        console.log("CameraError name:", cameraErr.name);
        console.log("CameraError message:", cameraErr.message);
        console.log("CameraError constraint:", cameraErr.constraint);

        // Camera permission is essential, so we need to throw the error
        throw cameraErr;
      }

      // Try to get cameras using Html5Qrcode.getCameras()
      try {
        console.log("Getting cameras using Html5Qrcode.getCameras()");
        const devices = await Html5Qrcode.getCameras();

        if (devices && devices.length) {
          console.log("Cameras found:", devices.length);
          setAvailableCameras(devices);
          setSelectedCamera(devices[0].id);
          setPermissionState("granted");
          return true;
        } else {
          console.log("No cameras found using Html5Qrcode.getCameras()");
          // Try fallback method
          return await getFallbackCameras();
        }
      } catch (cameraErr) {
        console.error("Error in Html5Qrcode.getCameras()", cameraErr);
        // Try fallback method if the primary method fails
        return await getFallbackCameras();
      }
    } catch (err: any) {
      console.error("Error getting cameras", err)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionState("denied")
        setError("Camera access denied. Please enable camera permission in your browser settings.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found on your device. Please connect a camera and try again.")
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Camera is in use by another application. Please close other apps that might be using the camera.")
      } else if (err.name === "OverconstrainedError") {
        setError("Camera constraints cannot be satisfied. Please try a different camera if available.")
      } else {
        setError("Error accessing camera: " + err.message)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const startScanner = async () => {
    if (!scannerRef.current) {
      console.error("Scanner reference is null");
      setError("Scanner initialization failed. Please refresh the page and try again.");
      return;
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Starting scanner process...");

      // First, request camera permissions by trying to get cameras
      // This will trigger the browser permission popup
      const hasCamera = await getCameras()

      if (!hasCamera || !selectedCamera) {
        console.log("No camera available or no camera selected");
        setIsLoading(false)
        return
      }

      console.log("Starting scanner with camera ID:", selectedCamera);

      try {
        // Now start the scanner with the selected camera
        await scannerRef.current.start(
          selectedCamera,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log("QR code scanned:", decodedText);
            onScan(decodedText)
          },
          (errorMessage) => {
            // QR code scan error (not used, but required by the library)
            console.log("QR scan error (non-fatal):", errorMessage);
          },
        )
        console.log("Scanner started successfully");
        setIsScanning(true)
      } catch (startErr: any) {
        console.error("Error starting scanner with selected camera", startErr);

        // If we get a NotFoundError and we're not already in fallback mode, try the fallback
        if (startErr.name === "NotFoundError" && !fallbackMode) {
          console.log("Got NotFoundError, trying fallback camera method...");

          // Try to get cameras using the fallback method
          const hasFallbackCamera = await getFallbackCameras();

          if (hasFallbackCamera && selectedCamera) {
            console.log("Retrying with fallback camera:", selectedCamera);

            try {
              // Try starting the scanner again with the fallback camera
              await scannerRef.current.start(
                selectedCamera,
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                  console.log("QR code scanned (fallback):", decodedText);
                  onScan(decodedText)
                },
                (errorMessage) => {
                  console.log("QR scan error in fallback mode (non-fatal):", errorMessage);
                },
              )
              console.log("Scanner started successfully in fallback mode");
              setIsScanning(true)
            } catch (fallbackErr: any) {
              console.error("Error starting scanner in fallback mode", fallbackErr);
              throw fallbackErr; // Let the outer catch handle this
            }
          } else {
            throw new Error("Failed to initialize camera in fallback mode");
          }
        } else {
          throw startErr; // Re-throw if it's not a NotFoundError or if fallback already failed
        }
      }
    } catch (err: any) {
      console.error("Error in scanner initialization process", err);

      // Provide more specific error messages based on the error type
      if (err.name === "NotFoundError") {
        setError("Camera device not found or no longer available. Please check your camera connection and try again.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Could not access your camera. It may be in use by another application.");
      } else if (err.name === "AbortError") {
        setError("Camera access was aborted. Please try again.");
      } else {
        setError("Error starting scanner: " + err.message);
      }
    } finally {
      setIsLoading(false)
    }
  }

  const stopScanner = async () => {
    if (!scannerRef.current) {
      console.log("Cannot stop scanner: scanner reference is null");
      setIsScanning(false);
      return;
    }

    if (!scannerRef.current.isScanning) {
      console.log("Scanner is not currently scanning");
      setIsScanning(false);
      return;
    }

    console.log("Stopping scanner...");
    setIsLoading(true)

    try {
      await scannerRef.current.stop()
      console.log("Scanner stopped successfully");
      setIsScanning(false)
    } catch (err: any) {
      console.error("Error stopping scanner", err)

      // Even if there's an error stopping the scanner, we should update the UI state
      setIsScanning(false)

      // Only show error message if it's not a NotFoundError (which is expected if camera was disconnected)
      if (err.name !== "NotFoundError") {
        setError("Error stopping scanner: " + err.message)
      } else {
        console.log("NotFoundError while stopping scanner - camera likely disconnected");
      }
    } finally {
      setIsLoading(false)
    }
  }

  const switchCamera = async () => {
    console.log("Switch camera requested");

    if (availableCameras.length <= 1) {
      console.log("Cannot switch camera: only one camera available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Stop current scanner
      if (scannerRef.current && scannerRef.current.isScanning) {
        console.log("Stopping current scanner before switching camera");
        await stopScanner();
      }

      // Switch to next camera
      const currentIndex = availableCameras.findIndex((camera) => camera.id === selectedCamera);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const newCameraId = availableCameras[nextIndex].id;

      console.log(`Switching from camera ${currentIndex} to camera ${nextIndex} (ID: ${newCameraId})`);
      setSelectedCamera(newCameraId);

      // Restart scanner if it was scanning
      if (isScanning) {
        console.log("Was scanning before switch, will restart scanner after delay");
        // Use a longer delay to ensure the camera has time to initialize
        setTimeout(() => {
          console.log("Restarting scanner with new camera");
          startScanner().catch(err => {
            console.error("Error restarting scanner after camera switch", err);
            // If we get a NotFoundError, try refreshing the camera list
            if (err.name === "NotFoundError") {
              console.log("Camera not found after switch, trying to refresh camera list");
              getCameras().then(hasCamera => {
                if (hasCamera && selectedCamera) {
                  console.log("Camera list refreshed, trying to restart scanner");
                  startScanner().catch(finalErr => {
                    console.error("Final error restarting scanner", finalErr);
                  });
                }
              }).catch(refreshErr => {
                console.error("Error refreshing camera list", refreshErr);
              });
            }
          });
        }, 1000);
      } else {
        console.log("Not scanning, camera switched without restarting scanner");
      }
    } catch (err) {
      console.error("Error during camera switch", err);
      setError("Failed to switch camera: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">{error}</p>

            {error.includes("not found") && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Troubleshooting steps:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Make sure your camera is properly connected and not being used by another application</li>
                  <li>Try refreshing the page</li>
                  <li>If using an external camera, try disconnecting and reconnecting it</li>
                  <li>Try using a different browser (Chrome or Edge recommended)</li>
                </ul>
              </div>
            )}

            {error.includes("aborted") && (
              <div className="mt-2 text-sm">
                <p>The camera access request was interrupted. Please try again.</p>
              </div>
            )}

            <button 
              onClick={() => setError(null)} 
              className="text-xs text-red-700 hover:text-red-900 mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-col items-center">
          <div id={scannerContainerId} className="w-full max-w-sm h-64 bg-gray-100 rounded-lg overflow-hidden relative">
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                {permissionState === "denied" ? (
                  <div className="text-center p-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Camera Access Required</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-3">
                      Please enable camera access in your browser settings to scan QR codes. Microphone access is optional.
                    </p>
                    <div className="text-xs text-gray-500 mt-2 space-y-1 text-left">
                      <p className="font-medium">How to enable access:</p>
                      <p>1. Click the camera/lock icon in your browser's address bar</p>
                      <p>2. Select "Allow" for camera access</p>
                      <p>3. Refresh this page</p>
                    </div>
                    <div className="text-xs text-amber-600 mt-2 p-2 bg-amber-50 rounded-md">
                      <p className="font-medium">Troubleshooting:</p>
                      <p>• Make sure you're using a secure (HTTPS) connection</p>
                      <p>• Try using Chrome, Edge, or Safari for best compatibility</p>
                      <p>• If using iOS, ensure camera access is enabled in device settings</p>
                    </div>
                    <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-3">
                      Refresh Page
                    </Button>
                  </div>
                ) : (
                  <Camera className="h-12 w-12 text-gray-400" />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {!isScanning ? (
              <Button
                onClick={startScanner}
                disabled={isLoading || permissionState === "denied"}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                {permissionState === "prompt" ? "Allow Camera Access" : "Start Scanning"}
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="destructive" disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4 mr-2" />
                )}
                Stop Scanning
              </Button>
            )}

            {availableCameras.length > 1 && (
              <Button onClick={switchCamera} variant="outline" disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
            )}
          </div>

          {availableCameras.length > 0 && (
            <div className="text-sm text-gray-500 mt-2">
              Using camera: {availableCameras.find((c) => c.id === selectedCamera)?.label || "Unknown"}
              {fallbackMode && (
                <span className="ml-2 text-amber-600 text-xs">(Fallback mode)</span>
              )}
            </div>
          )}

          {permissionState === "denied" && (
            <div className="mt-4 text-sm text-gray-500">
              <p className="font-medium">Alternative option:</p>
              <p>You can use the "Manual Check-in" tab to enter ticket IDs without using the camera.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
