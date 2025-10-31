import React, { useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';

interface RideMapProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  height?: string;
  showDistance?: boolean;
  onRouteCalculated?: (distance: { text: string; value: number }, duration: { text: string; value: number }) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

declare global {
  interface Window {
    google: any;
  }
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const RideMap: React.FC<RideMapProps> = ({
  originLat,
  originLng,
  destLat,
  destLng,
  height = '400px',
  showDistance = false,
  onRouteCalculated,
}) => {
  const [directions, setDirections] = React.useState<any>(null);
  const [distance, setDistance] = React.useState<{ text: string; value: number } | null>(null);
  const [duration, setDuration] = React.useState<{ text: string; value: number } | null>(null);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !mapLoaded) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          
          // Mesafe ve süre bilgilerini al
          if (result.routes && result.routes[0] && result.routes[0].legs && result.routes[0].legs[0]) {
            const leg = result.routes[0].legs[0];
            const distanceInfo = {
              text: leg.distance.text,
              value: leg.distance.value, // metre cinsinden
            };
            const durationInfo = {
              text: leg.duration.text,
              value: leg.duration.value, // saniye cinsinden
            };
            
            setDistance(distanceInfo);
            setDuration(durationInfo);
            
            // Callback ile mesafe bilgisini dışarı aktar
            if (onRouteCalculated) {
              onRouteCalculated(distanceInfo, durationInfo);
            }
          }
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [originLat, originLng, destLat, destLng, isLoaded, mapLoaded]);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  };

  const center = {
    lat: (originLat + destLat) / 2,
    lng: (originLng + destLng) / 2,
  };

  if (!isLoaded) {
    return (
      <div style={{ width: '100%', height, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Harita yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      {showDistance && distance && duration && (
        <div style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          gap: '20px',
          fontSize: '0.9em'
        }}>
          <div>
            <strong>Mesafe:</strong> {distance.text}
          </div>
          <div>
            <strong>Tahmini Süre:</strong> {duration.text}
          </div>
        </div>
      )}
      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={center}
        zoom={10}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {directions && <DirectionsRenderer directions={directions} />}
        <Marker position={{ lat: originLat, lng: originLng }} label="A" />
        <Marker position={{ lat: destLat, lng: destLng }} label="B" />
      </GoogleMap>
    </div>
  );
};

export default RideMap;

