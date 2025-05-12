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
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = "qr-reader"

  useEffect(() => {
    // Initialize the scanner when the component mounts
    scannerRef.current = new Html5Qrcode(scannerContainerId)

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(devices)
          setSelectedCamera(devices[0].id)
          setPermissionGranted(true)
        } else {
          setError("No cameras found on this device")
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err)
        setError("Error accessing camera: " + err.message)
      })

    // Clean up the scanner when the component unmounts
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Error stopping scanner", err))
      }
    }
  }, [])

  const startScanner = async () => {
    if (!scannerRef.current || !selectedCamera) return

    setIsLoading(true)
    setError(null)

    try {
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
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            {!isScanning ? (
              <Button
                onClick={startScanner}
                disabled={!selectedCamera || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                Start Scanning
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
        </div>
      </CardContent>
    </Card>
  )
}
