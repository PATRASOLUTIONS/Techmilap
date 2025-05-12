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

  const getCameras = async () => {
    try {
      setIsLoading(true)

      // First, explicitly request both camera and microphone permissions
      // This will trigger the browser permission popup for both
      try {
        await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        // If we get here, both permissions were granted
      } catch (mediaErr: any) {
        console.error("Error requesting media permissions", mediaErr);
        // Continue anyway, as we only need camera for QR scanning
      }

      const devices = await Html5Qrcode.getCameras()

      if (devices && devices.length) {
        setAvailableCameras(devices)
        setSelectedCamera(devices[0].id)
        setPermissionState("granted")
        return true
      } else {
        setError("No cameras found on this device")
        return false
      }
    } catch (err: any) {
      console.error("Error getting cameras", err)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionState("denied")
        setError("Camera or microphone access denied. Please enable both permissions in your browser settings.")
      } else {
        setError("Error accessing camera or microphone: " + err.message)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const startScanner = async () => {
    if (!scannerRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      // First, request camera permissions by trying to get cameras
      // This will trigger the browser permission popup
      const hasCamera = await getCameras()

      if (!hasCamera || !selectedCamera) {
        setIsLoading(false)
        return
      }

      // Now start the scanner with the selected camera
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText)
        },
        (errorMessage) => {
          // QR code scan error (not used, but required by the library)
        },
      )
      setIsScanning(true)
    } catch (err: any) {
      console.error("Error starting scanner", err)
      setError("Error starting scanner: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const stopScanner = async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning) return

    setIsLoading(true)

    try {
      await scannerRef.current.stop()
      setIsScanning(false)
    } catch (err: any) {
      console.error("Error stopping scanner", err)
      setError("Error stopping scanner: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return

    // Stop current scanner
    if (scannerRef.current && scannerRef.current.isScanning) {
      await stopScanner()
    }

    // Switch to next camera
    const currentIndex = availableCameras.findIndex((camera) => camera.id === selectedCamera)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    setSelectedCamera(availableCameras[nextIndex].id)

    // Restart scanner if it was scanning
    if (isScanning) {
      setTimeout(() => {
        startScanner()
      }, 500)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <div className="flex flex-col items-center">
          <div id={scannerContainerId} className="w-full max-w-sm h-64 bg-gray-100 rounded-lg overflow-hidden relative">
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                {permissionState === "denied" ? (
                  <div className="text-center p-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Camera & Microphone Access Required</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-3">
                      Please enable camera and microphone access in your browser settings to scan QR codes.
                    </p>
                    <div className="text-xs text-gray-500 mt-2 space-y-1 text-left">
                      <p className="font-medium">How to enable access:</p>
                      <p>1. Click the camera/lock icon in your browser's address bar</p>
                      <p>2. Select "Allow" for both camera and microphone access</p>
                      <p>3. Refresh this page</p>
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
                {permissionState === "prompt" ? "Allow Camera & Microphone" : "Start Scanning"}
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
