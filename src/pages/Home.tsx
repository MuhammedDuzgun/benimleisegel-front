import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rideService } from '../api/rideService';
import { rideRequestService } from '../api/rideRequestService';
import { useAuth } from '../context/AuthContext';
import { Ride } from '../types';
import './Home.css';

const Home: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestingRideId, setRequestingRideId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
            {rides.map((ride) => (
              <div key={ride.id} className="ride-card">
                <div className="ride-header">
                  <div className="ride-route">
                    <div className="route-point">
                      <span className="route-icon">📍</span>
                      <strong className="city-name">{ride.originCity}</strong>
                      <p className="district-name">{ride.originDistrict}</p>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="route-point">
                      <span className="route-icon">🎯</span>
                      <strong className="city-name">{ride.destinationCity}</strong>
                      <p className="district-name">{ride.destinationDistrict}</p>
                    </div>
                  </div>
                </div>
                
                <div className="ride-body">
                  <div className="ride-date-section">
                    <div className="ride-time">
                      🕒 {formatDateTime(ride.departTime)}
                    </div>
                  </div>
                  
                  <div className="ride-price-section">
                    <div className="price-label">Yolculuk Ücreti</div>
                    <span className="ride-price-badge">₺{ride.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="ride-footer">
                    <span className="driver-name">{ride.driver.firstName} {ride.driver.lastName}</span>
                    <span className="vehicle-info-small">
                      {ride.driver.vehicle?.brand} {ride.driver.vehicle?.model}
                    </span>
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={() => handleRideRequest(ride.id)}
                      className="btn-request"
                      disabled={requestingRideId === ride.id}
                    >
                      {requestingRideId === ride.id ? 'Gönderiliyor...' : 'Talepte Bulun'}
                    </button>
                  )}
                </div>
              </div>
            ))}
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
