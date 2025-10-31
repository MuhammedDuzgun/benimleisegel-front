import React, { useEffect } from 'react';
import { Ride } from '../types';
import RideMap from './RideMap';
import './RideModal.css';

interface RideModalProps {
  ride: Ride | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestRide?: (rideId: number) => void;
  isAuthenticated?: boolean;
  requestingRideId?: number | null;
}

const RideModal: React.FC<RideModalProps> = ({
  ride,
  isOpen,
  onClose,
  onRequestRide,
  isAuthenticated = false,
  requestingRideId = null,
}) => {
  // ESC tuşu ile modal'ı kapat ve body scroll'unu engelle
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Scroll'u engelle
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ride) return null;

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      const km = (meters / 1000).toFixed(1);
      return `${km} km`;
    }
    return `${meters} m`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0 && minutes > 0) {
      return `${hours} sa ${minutes} dk`;
    } else if (hours > 0) {
      return `${hours} saat`;
    } else {
      return `${minutes} dakika`;
    }
  };

  return (
    <div className="ride-modal-overlay" onClick={onClose}>
      <div className="ride-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="ride-modal-close" onClick={onClose} aria-label="Kapat">
          ✕
        </button>
        
        <div className="ride-modal-header">
          <h2 className="ride-modal-title">{ride.title}</h2>
        </div>

        <div className="ride-modal-body">
          {/* Temel Bilgiler */}
          <div className="ride-modal-section">
            <h3 className="ride-modal-section-title">📋 Yolculuk Bilgileri</h3>
            <div className="ride-modal-info-grid">
              <div className="ride-modal-info-item">
                <span className="ride-modal-info-icon">🕒</span>
                <div>
                  <span className="ride-modal-info-label">Kalkış Zamanı</span>
                  <span className="ride-modal-info-value">{formatDateTime(ride.departTime)}</span>
                </div>
              </div>
              <div className="ride-modal-info-item">
                <span className="ride-modal-info-icon">💰</span>
                <div>
                  <span className="ride-modal-info-label">Ücret</span>
                  <span className="ride-modal-info-value price-value">₺{ride.price.toFixed(2)}</span>
                </div>
              </div>
              {ride.distanceInMeters > 0 && (
                <>
                  <div className="ride-modal-info-item">
                    <span className="ride-modal-info-icon">📏</span>
                    <div>
                      <span className="ride-modal-info-label">Mesafe</span>
                      <span className="ride-modal-info-value">{formatDistance(ride.distanceInMeters)}</span>
                    </div>
                  </div>
                  <div className="ride-modal-info-item">
                    <span className="ride-modal-info-icon">⏱️</span>
                    <div>
                      <span className="ride-modal-info-label">Tahmini Süre</span>
                      <span className="ride-modal-info-value">{formatDuration(ride.durationInSeconds)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Adresler */}
          <div className="ride-modal-section">
            <h3 className="ride-modal-section-title">📍 Rota Detayları</h3>
            <div className="ride-modal-addresses">
              <div className="ride-modal-address-item origin">
                <div className="ride-modal-address-header">
                  <span className="ride-modal-address-icon">📍</span>
                  <span className="ride-modal-address-label">Kalkış Noktası</span>
                </div>
                <p className="ride-modal-address-text">{ride.originAddress}</p>
              </div>
              <div className="ride-modal-arrow">↓</div>
              <div className="ride-modal-address-item destination">
                <div className="ride-modal-address-header">
                  <span className="ride-modal-address-icon">🎯</span>
                  <span className="ride-modal-address-label">Varış Noktası</span>
                </div>
                <p className="ride-modal-address-text">{ride.destinationAddress}</p>
              </div>
            </div>
          </div>

          {/* Harita */}
          {ride.originLatitude && ride.originLongitude && 
           ride.destinationLatitude && ride.destinationLongitude && (
            <div className="ride-modal-section">
              <h3 className="ride-modal-section-title">🗺️ Rota Haritası</h3>
              <div className="ride-modal-map-container">
                <RideMap
                  originLat={ride.originLatitude}
                  originLng={ride.originLongitude}
                  destLat={ride.destinationLatitude}
                  destLng={ride.destinationLongitude}
                  height="400px"
                  showDistance={true}
                />
              </div>
            </div>
          )}

          {/* Sürücü Bilgileri */}
          <div className="ride-modal-section">
            <h3 className="ride-modal-section-title">👤 Sürücü Bilgileri</h3>
            <div className="ride-modal-driver-info">
              <div className="ride-modal-driver-details">
                <div className="ride-modal-driver-name">
                  {ride.driver.firstName} {ride.driver.lastName}
                </div>
                <div className="ride-modal-driver-score">
                  ⭐ {ride.driver.score?.toFixed(1) || '0.0'} / 5.0
                </div>
              </div>
              {ride.driver.vehicle && (
                <div className="ride-modal-vehicle-info">
                  <span className="ride-modal-vehicle-icon">🚗</span>
                  <span className="ride-modal-vehicle-text">
                    {ride.driver.vehicle.brand} {ride.driver.vehicle.model}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Talep Butonu */}
          {isAuthenticated && (
            <div className="ride-modal-actions">
              <button
                onClick={() => {
                  if (onRequestRide) {
                    onRequestRide(ride.id);
                  }
                }}
                className="ride-modal-request-btn"
                disabled={requestingRideId === ride.id}
              >
                {requestingRideId === ride.id ? 'Gönderiliyor...' : 'Talepte Bulun'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideModal;

