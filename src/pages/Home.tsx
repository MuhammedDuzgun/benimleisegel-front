import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rideService } from '../api/rideService';
import { rideRequestService } from '../api/rideRequestService';
import { useAuth } from '../context/AuthContext';
import { Ride } from '../types';
import RideMap from '../components/RideMap';
import './Home.css';

const Home: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestingRideId, setRequestingRideId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAvailableRides();
  }, []);

  const loadAvailableRides = async () => {
    try {
      const data = await rideService.getAvailableRides();
      setRides(data);
      setError(false);
    } catch (err) {
      console.error('Yolculuklar yüklenemedi:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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

  const handleRideRequest = async (rideId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setRequestingRideId(rideId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await rideRequestService.createRideRequest({ id: rideId.toString() });
      setSuccessMessage('Talebiniz başarıyla gönderildi!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Talep gönderilirken bir hata oluştu.';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setRequestingRideId(null);
    }
  };

  return (
    <div className="home-container">
      <nav className="home-nav">
        <Link to="/" className="home-logo">
          <h1>Benimle İşe Gel</h1>
        </Link>
        <div className="nav-buttons">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary">Giriş Yap</Link>
              <Link to="/signup" className="btn-secondary">Kayıt Ol</Link>
            </>
          )}
        </div>
      </nav>

      <div className="hero-section">
        <div className="hero-content">
          <h2>İşe Giderken Yolculuğunuzu Paylaşın</h2>
          <p className="hero-description">
            Aynı yöne giden çalışanları buluşturuyoruz. Hem çevreye katkıda bulunun, hem de yol masraflarınızı paylaşın!
          </p>
        </div>
      </div>

      <div className="rides-section">
        <h3>Aktif Yolculuklar</h3>
        {successMessage && <div className="success-message">{successMessage}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Yolculuklar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>Yolculuklar yüklenirken bir hata oluştu.</p>
            <button onClick={loadAvailableRides} className="retry-btn">Tekrar Dene</button>
          </div>
        ) : rides.length === 0 ? (
          <div className="empty-rides-state">
            <div className="empty-icon">🚗</div>
            <p>Henüz aktif yolculuk bulunmuyor.</p>
            <p className="empty-subtitle">İlk yolculuğu siz oluşturun!</p>
          </div>
        ) : (
          <div className="rides-grid">
            {rides.map((ride) => {
              const isExpanded = expandedRideId === ride.id;
              return (
                <div key={ride.id} className="ride-card" onClick={() => setExpandedRideId(isExpanded ? null : ride.id)} style={{ cursor: 'pointer' }}>
                  <div className="ride-header">
                    <h3 className="ride-title">{ride.title}</h3>
                  </div>
                  
                  <div className="ride-body">
                    {/* Temel Bilgiler - Her zaman görünür */}
                    <div className="ride-basic-info">
                      <div className="ride-basic-row">
                        <div className="ride-basic-item">
                          <span className="basic-icon">🕒</span>
                          <span className="basic-text">{formatDateTime(ride.departTime)}</span>
                        </div>
                        {ride.distanceInMeters > 0 && (
                          <div className="ride-basic-item">
                            <span className="basic-icon">📏</span>
                            <span className="basic-text">{formatDistance(ride.distanceInMeters)} • {formatDuration(ride.durationInSeconds)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ride-basic-row">
                        <div className="ride-basic-item">
                          <span className="basic-icon">💰</span>
                          <span className="basic-text price-text">₺{ride.price.toFixed(2)}</span>
                        </div>
                        <div className="ride-basic-item">
                          <span className="basic-icon">👤</span>
                          <span className="basic-text">{ride.driver.firstName} {ride.driver.lastName}</span>
                          <span className="driver-score-small">⭐ {ride.driver.score?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Genişletilmiş Detaylar - Sadece açıkken görünür */}
                    {isExpanded && (
                      <div className="ride-expanded-details">
                        <div className="ride-addresses-compact">
                          <div className="address-item">
                            <span className="address-icon">📍</span>
                            <span className="address-text" title={ride.originAddress}>{ride.originAddress}</span>
                          </div>
                          <div className="address-item">
                            <span className="address-icon">🎯</span>
                            <span className="address-text" title={ride.destinationAddress}>{ride.destinationAddress}</span>
                          </div>
                        </div>

                        {ride.driver.vehicle && (
                          <div className="vehicle-detail">
                            <span className="vehicle-icon">🚗</span>
                            <span className="vehicle-text">{ride.driver.vehicle.brand} {ride.driver.vehicle.model}</span>
                          </div>
                        )}

                        {ride.originLatitude && ride.originLongitude && 
                         ride.destinationLatitude && ride.destinationLongitude && (
                          <div style={{ marginTop: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                            <RideMap
                              originLat={ride.originLatitude}
                              originLng={ride.originLongitude}
                              destLat={ride.destinationLatitude}
                              destLng={ride.destinationLongitude}
                              height="300px"
                              showDistance={true}
                            />
                          </div>
                        )}

                        {isAuthenticated && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRideRequest(ride.id);
                            }}
                            className="btn-request"
                            disabled={requestingRideId === ride.id}
                            style={{ marginTop: '15px', width: '100%' }}
                          >
                            {requestingRideId === ride.id ? 'Gönderiliyor...' : 'Talepte Bulun'}
                          </button>
                        )}
                      </div>
                    )}

                    {!isExpanded && isAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRideRequest(ride.id);
                        }}
                        className="btn-request"
                        disabled={requestingRideId === ride.id}
                        style={{ marginTop: '15px', width: '100%' }}
                      >
                        {requestingRideId === ride.id ? 'Gönderiliyor...' : 'Talepte Bulun'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="features-section">
        <h3>Neden Benimle İşe Gel?</h3>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h4>Ekonomik</h4>
            <p>Yol masraflarınızı paylaşarak tasarruf edin</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h4>Çevre Dostu</h4>
            <p>Karbon ayak izinizi azaltın</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h4>Güvenli</h4>
            <p>Sadece kurumsal çalışanlarla eşleşin</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h4>Kolay Kullanım</h4>
            <p>Basit ve kullanıcı dostu arayüz</p>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <h3>Nasıl Çalışır?</h3>
        
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4>Kayıt Olun</h4>
            <p>Hızlıca hesabınızı oluşturun</p>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h4>Araç Bilgilerinizi Ekleyin</h4>
            <p>Aracınızın detaylarını girin</p>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h4>Rota Belirleyin</h4>
            <p>İş yerinize giden rotanızı seçin</p>
          </div>

          <div className="step-card">
            <div className="step-number">4</div>
            <h4>Yolculuğu Paylaşın</h4>
            <p>Aynı yöne giden çalışanlarla eşleşin</p>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Benimle İşe Gel</h3>
            <p>İşe gidiş-dönüş yolculuklarınızı daha ekonomik ve çevre dostu hale getirin.</p>
          </div>
          <div className="footer-links">
            <Link to="/login">Giriş Yap</Link>
            <Link to="/signup">Kayıt Ol</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
