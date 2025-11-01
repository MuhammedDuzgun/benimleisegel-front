import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { vehicleService } from '../api/vehicleService';
import { userService } from '../api/userService';
import { rideService } from '../api/rideService';
import { rideRequestService } from '../api/rideRequestService';
import { rideAIService } from '../api/rideAIService';
import { User, Ride, RideStatus, RideRequest, RideRequestStatus } from '../types';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import RideMap from '../components/RideMap';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [myRequests, setMyRequests] = useState<RideRequest[]>([]);
  const [selectedRideRequests, setSelectedRideRequests] = useState<RideRequest[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showRideForm, setShowRideForm] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [vehicleData, setVehicleData] = useState({ plate: '', brand: '', model: '' });
  const [rideData, setRideData] = useState({
    title: '',
    originAddress: '',
    originLatitude: 0,
    originLongitude: 0,
    destinationAddress: '',
    destinationLatitude: 0,
    destinationLongitude: 0,
    distanceInMeters: 0,
    durationInSeconds: 0,
    departTime: '',
    price: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updatingRideId, setUpdatingRideId] = useState<number | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
    loadUserRides();
    loadMyRequests();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await userService.getAuthenticatedUser();
      setUser(userData);
    } catch (err: any) {
      showError('Kullanıcı bilgileri yüklenemedi.');
    }
  };

  const getStatusLabel = (status: RideStatus): string => {
    const labels: Record<RideStatus, string> = {
      OPEN: 'Açık',
      ONGOING: 'Devam Ediyor',
      COMPLETED: 'Tamamlandı',
      CANCELED: 'İptal Edildi',
    };
    return labels[status];
  };

  const getRequestStatusLabel = (status: RideRequestStatus): string => {
    const labels: Record<RideRequestStatus, string> = {
      PENDING: 'Beklemede',
      ACCEPTED: 'Kabul Edildi',
      REJECTED: 'Reddedildi',
    };
    return labels[status];
  };

  const loadMyRequests = async () => {
    try {
      const data = await rideRequestService.getMyRideRequests();
      setMyRequests(data);
    } catch (err) {
      console.error('Talepler yüklenemedi:', err);
    }
  };

  const loadRideRequests = async (rideId: number) => {
    try {
      const data = await rideRequestService.getRideRequestsForRide(rideId);
      setSelectedRideRequests(data);
      setSelectedRideId(rideId);
    } catch (err) {
      console.error('Yolculuk talepleri yüklenemedi:', err);
    }
  };

  const handleRequestStatusUpdate = async (requestId: number, newStatus: RideRequestStatus) => {
    try {
      await rideRequestService.updateRideRequestStatus(requestId, { status: newStatus });
      showSuccess(`Talep durumu "${getRequestStatusLabel(newStatus)}" olarak güncellendi!`);
      if (selectedRideId) {
        await loadRideRequests(selectedRideId);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Talep durumu güncellenirken bir hata oluştu.';
      showError(errorMessage);
    }
  };

  const loadUserRides = async () => {
    try {
      const data = await rideService.getUserRides();
      setRides(data);
    } catch (err) {
      console.error('Yolculuklar yüklenemedi:', err);
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

  const handleGetAISuggestion = async () => {
    if (!rideData.distanceInMeters || !rideData.durationInSeconds || !user?.vehicle) {
      return;
    }

    setAiLoading(true);
    setAiSuggestion(null);

    try {
      const response = await rideAIService.getPriceSuggestion({
        distanceInMeters: rideData.distanceInMeters,
        durationInSeconds: rideData.durationInSeconds,
        carBrand: user.vehicle.brand,
        carModel: user.vehicle.model,
      });

      setAiSuggestion(response.message);

      // AI önerisinden fiyat çıkarmaya çalış (eğer varsa)
      const priceMatch = response.message.match(/₺?(\d+[.,]\d+)/);
      if (priceMatch) {
        const suggestedPrice = parseFloat(priceMatch[1].replace(',', '.'));
        if (!isNaN(suggestedPrice)) {
          // Önerilen fiyatı otomatik doldurma seçeneği sunabiliriz
        }
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'AI önerisi alınırken bir hata oluştu.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        await userService.deleteUser();
        showSuccess('Hesabınız başarıyla silindi.');
        logout();
        navigate('/login');
      } catch (err: any) {
        showError('Hesap silinirken bir hata oluştu.');
      }
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await vehicleService.addVehicle(vehicleData);
      showSuccess('Araç başarıyla eklendi!');
      setVehicleData({ plate: '', brand: '', model: '' });
      setShowVehicleForm(false);
      await fetchUserData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Araç eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (window.confirm('Aracınızı silmek istediğinizden emin misiniz?')) {
      try {
        await vehicleService.deleteVehicle();
        showSuccess('Araç başarıyla silindi!');
        await fetchUserData();
      } catch (err: any) {
        showError('Araç silinirken bir hata oluştu.');
      }
    }
  };

  const handleRideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!rideData.originLatitude || !rideData.originLongitude || 
          !rideData.destinationLatitude || !rideData.destinationLongitude ||
          rideData.originLatitude === 0 || rideData.originLongitude === 0 ||
          rideData.destinationLatitude === 0 || rideData.destinationLongitude === 0) {
        showError('Lütfen geçerli başlangıç ve varış adreslerini seçin. Adresler otomatik tamamlanmalı ve koordinatlar belirlenmiş olmalı.');
        setLoading(false);
        return;
      }

      if (!rideData.distanceInMeters || !rideData.durationInSeconds) {
        showError('Lütfen rota hesaplanana kadar bekleyin. Harita üzerinde mesafe ve süre görünmelidir.');
        setLoading(false);
        return;
      }

      const submitData = {
        title: rideData.title,
        originAddress: rideData.originAddress,
        destinationAddress: rideData.destinationAddress,
        distanceInMeters: rideData.distanceInMeters,
        durationInSeconds: rideData.durationInSeconds,
        originLatitude: rideData.originLatitude,
        originLongitude: rideData.originLongitude,
        destinationLatitude: rideData.destinationLatitude,
        destinationLongitude: rideData.destinationLongitude,
        departTime: new Date(rideData.departTime).toISOString(),
        price: rideData.price,
      };
      
      await rideService.createRide(submitData);
      showSuccess('Yolculuk başarıyla oluşturuldu!');
      setRideData({
        title: '',
        originAddress: '',
        originLatitude: 0,
        originLongitude: 0,
        destinationAddress: '',
        destinationLatitude: 0,
        destinationLongitude: 0,
        distanceInMeters: 0,
        durationInSeconds: 0,
        departTime: '',
        price: 0,
      });
      setAiSuggestion(null);
      setShowRideForm(false);
      await loadUserRides();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Yolculuk oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (rideId: number, currentStatus: RideStatus, newStatus: RideStatus) => {
    // Aynı status seçildiyse işlem yapma
    if (currentStatus === newStatus) {
      return;
    }

    // Kullanıcıdan onay al
    const statusLabel = getStatusLabel(newStatus);
    if (!window.confirm(`Yolculuk durumunu "${statusLabel}" olarak değiştirmek istediğinizden emin misiniz?`)) {
      return;
    }

    setUpdatingRideId(rideId);

    try {
      await rideService.updateRideStatus(rideId, { status: newStatus });
      showSuccess(`Yolculuk durumu "${statusLabel}" olarak güncellendi!`);
      await loadUserRides();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Durum güncellenirken bir hata oluştu.';
      showError(errorMessage);
      // Hata durumunda liste yenileniyor, böylece select eski değerine dönüyor
      await loadUserRides();
    } finally {
      setUpdatingRideId(null);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <Link to="/" className="site-logo">
          <h1>Benimle İşe Gel</h1>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/ratings" className="btn-secondary">
            ⭐ Değerlendirmeler
          </Link>
          <button onClick={handleLogout} className="btn-secondary">
            Çıkış Yap
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="user-section">
          <h2>Hoş Geldiniz, {user?.firstName}!</h2>
          <div className="user-info">
            <p><strong>Ad Soyad:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>E-posta:</strong> {user?.email}</p>
            <p><strong>Telefon:</strong> {user?.phone}</p>
            <p><strong>Skorunuz:</strong> ⭐ {user?.score?.toFixed(1) || '0.0'} / 5.0</p>
          </div>
          <button onClick={handleDeleteAccount} className="btn-danger">
            Hesabı Sil
          </button>
        </div>

        <div className="vehicle-section">
          <h2>Araç Bilgileri</h2>

          {user?.vehicle && !showVehicleForm && (
            <div className="vehicle-info">
              <p><strong>Plaka:</strong> {user.vehicle.plate}</p>
              <p><strong>Marka:</strong> {user.vehicle.brand}</p>
              <p><strong>Model:</strong> {user.vehicle.model}</p>
              <button onClick={handleDeleteVehicle} className="btn-danger">
                Aracı Sil
              </button>
            </div>
          )}

          {!user?.vehicle && !showVehicleForm && (
            <div>
              <p style={{ marginBottom: '15px', color: '#666' }}>Henüz araç eklenmemiş.</p>
              <button onClick={() => setShowVehicleForm(true)} className="btn-primary">
                Araç Ekle
              </button>
            </div>
          )}

          {showVehicleForm && (
            <form onSubmit={handleVehicleSubmit} className="vehicle-form">
              <div className="form-group">
                <label htmlFor="plate">Plaka</label>
                <input
                  type="text"
                  id="plate"
                  value={vehicleData.plate}
                  onChange={(e) => setVehicleData({ ...vehicleData, plate: e.target.value })}
                  required
                  placeholder="34 ABC 1234"
                />
              </div>

              <div className="form-group">
                <label htmlFor="brand">Marka</label>
                <input
                  type="text"
                  id="brand"
                  value={vehicleData.brand}
                  onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })}
                  required
                  placeholder="Toyota"
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">Model</label>
                <input
                  type="text"
                  id="model"
                  value={vehicleData.model}
                  onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                  required
                  placeholder="Corolla"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Ekleniyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVehicleForm(false);
                    setVehicleData({ plate: '', brand: '', model: '' });
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="rides-section">
          <h2>Yolculuklarım</h2>

          {!user?.vehicle && (
            <div className="info-message">
              Yolculuk oluşturabilmek için önce araç eklemelisiniz.
            </div>
          )}

          {user?.vehicle && !showRideForm && (
            <button onClick={() => setShowRideForm(true)} className="btn-primary" style={{ marginBottom: '20px' }}>
              + Yeni Yolculuk Oluştur
            </button>
          )}

          {showRideForm && (
            <form onSubmit={handleRideSubmit} className="ride-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: '1 1 100%' }}>
                  <label htmlFor="title">Yolculuk Başlığı</label>
                  <input
                    type="text"
                    id="title"
                    value={rideData.title}
                    onChange={(e) => setRideData({ ...rideData, title: e.target.value })}
                    required
                    placeholder="Örn: İşe Gidiş - İstanbul Kadıköy - Maslak"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="originAddress">Başlangıç Adresi</label>
                  <PlacesAutocomplete
                    id="originAddress"
                    value={rideData.originAddress}
                    onChange={(address, city, district, lat, lng) => {
                      setRideData({
                        ...rideData,
                        originAddress: address,
                        originLatitude: lat,
                        originLongitude: lng,
                      });
                    }}
                    placeholder="Başlangıç adresini girin..."
                    className="form-input"
                  />
                  {rideData.originAddress && (
                    <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
                      ✓ Adres seçildi
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="destinationAddress">Varış Adresi</label>
                  <PlacesAutocomplete
                    id="destinationAddress"
                    value={rideData.destinationAddress}
                    onChange={(address, city, district, lat, lng) => {
                      setRideData({
                        ...rideData,
                        destinationAddress: address,
                        destinationLatitude: lat,
                        destinationLongitude: lng,
                      });
                    }}
                    placeholder="Varış adresini girin..."
                    className="form-input"
                  />
                  {rideData.destinationAddress && (
                    <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
                      ✓ Adres seçildi
                    </p>
                  )}
                </div>
              </div>

              {(rideData.originLatitude && rideData.originLongitude && 
               rideData.destinationLatitude && rideData.destinationLongitude &&
               rideData.originLatitude !== 0 && rideData.originLongitude !== 0 &&
               rideData.destinationLatitude !== 0 && rideData.destinationLongitude !== 0) ? (
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>
                    🗺️ Rota Önizlemesi
                  </label>
                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                    <RideMap
                      originLat={rideData.originLatitude}
                      originLng={rideData.originLongitude}
                      destLat={rideData.destinationLatitude}
                      destLng={rideData.destinationLongitude}
                      height="300px"
                      showDistance={true}
                      onRouteCalculated={(distance, duration) => {
                        setRideData({
                          ...rideData,
                          distanceInMeters: distance.value,
                          durationInSeconds: duration.value,
                        });
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="departTime">Kalkış Zamanı</label>
                  <input
                    type="datetime-local"
                    id="departTime"
                    value={rideData.departTime}
                    onChange={(e) => setRideData({ ...rideData, departTime: e.target.value })}
                    min={getMinDateTime()}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="price">Fiyat (₺)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <input
                      type="number"
                      id="price"
                      value={rideData.price || ''}
                      onChange={(e) => {
                        setRideData({ ...rideData, price: parseFloat(e.target.value) });
                        setAiSuggestion(null);
                      }}
                      onWheel={(e) => {
                        e.currentTarget.blur();
                      }}
                      required
                      placeholder="350.50"
                      step="0.01"
                      min="0"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleGetAISuggestion}
                      disabled={
                        !rideData.distanceInMeters || 
                        !rideData.durationInSeconds || 
                        rideData.distanceInMeters === 0 || 
                        rideData.durationInSeconds === 0 ||
                        !user?.vehicle ||
                        aiLoading
                      }
                      className="btn-secondary"
                      style={{ 
                        whiteSpace: 'nowrap',
                        opacity: (!rideData.distanceInMeters || !rideData.durationInSeconds || !user?.vehicle) ? 0.6 : 1,
                        cursor: (!rideData.distanceInMeters || !rideData.durationInSeconds || !user?.vehicle) ? 'not-allowed' : 'pointer'
                      }}
                      title={(!rideData.distanceInMeters || !rideData.durationInSeconds) ? 'Önce kalkış ve varış adreslerini seçin ve rota hesaplanana kadar bekleyin.' : 'AI ile ücret önerisi al'}
                    >
                      {aiLoading ? '⏳' : '🤖 AI Önerisi'}
                    </button>
                  </div>
                  {aiSuggestion && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '12px', 
                      background: '#e8f5e9', 
                      border: '1px solid #4caf50',
                      borderRadius: '8px',
                      fontSize: '0.9em',
                      color: '#2e7d32'
                    }}>
                      <strong>🤖 AI Önerisi:</strong> {aiSuggestion}
                      <button
                        type="button"
                        onClick={() => setAiSuggestion(null)}
                        style={{
                          marginLeft: '10px',
                          background: 'none',
                          border: 'none',
                          color: '#2e7d32',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0 5px'
                        }}
                        title="Öneriyi kapat"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {(!rideData.distanceInMeters || !rideData.durationInSeconds) && (
                    <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px', fontStyle: 'italic' }}>
                      💡 AI önerisi almak için önce kalkış ve varış adreslerini seçin ve rota hesaplanana kadar bekleyin.
                    </p>
                  )}
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Oluşturuluyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRideForm(false);
                    setRideData({
                      title: '',
                      originAddress: '',
                      originLatitude: 0,
                      originLongitude: 0,
                      destinationAddress: '',
                      destinationLatitude: 0,
                      destinationLongitude: 0,
                      distanceInMeters: 0,
                      durationInSeconds: 0,
                      departTime: '',
                      price: 0,
                    });
                    setAiSuggestion(null);
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
              </div>
            </form>
          )}

          <div className="my-rides-list">
            {!user?.vehicle ? null : rides.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚗</div>
                <p>Henüz yolculuk oluşturmadınız.</p>
                <p className="empty-subtitle">Yukarıdaki butona tıklayarak ilk yolculuğunuzu oluşturun!</p>
              </div>
            ) : (
              rides.map((ride) => (
                <div key={ride.id} className="my-ride-card">
                  <div className="ride-card-header">
                    <div className="ride-route-info">
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700', color: '#333' }}>
                        {ride.title}
                      </h3>
                      <div className="route-cities">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9em', color: '#666' }}>
                          <span>📍 {ride.originAddress}</span>
                          <span>🎯 {ride.destinationAddress}</span>
                        </div>
                      </div>
                      <div className="ride-meta">
                        <span>🕒 {formatDateTime(ride.departTime)}</span>
                        <span className="price">₺{ride.price.toFixed(2)}</span>
                        {ride.distanceInMeters > 0 && (
                          <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '10px' }}>
                            📏 {formatDistance(ride.distanceInMeters)} • ⏱️ {formatDuration(ride.durationInSeconds)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ride-status-badge" data-status={ride.status.toLowerCase()}>
                      {getStatusLabel(ride.status)}
                    </div>
                  </div>

                  <div className="ride-actions">
                    <label className="status-label">Durum Güncelle:</label>
                    <select
                      value={ride.status}
                      onChange={(e) => handleStatusUpdate(ride.id, ride.status, e.target.value as RideStatus)}
                      className="status-select"
                      disabled={updatingRideId === ride.id || ride.status === 'COMPLETED'}
                    >
                      <option value="OPEN">Açık</option>
                      <option value="ONGOING">Devam Ediyor</option>
                      <option value="COMPLETED">Tamamlandı</option>
                      <option value="CANCELED">İptal Edildi</option>
                    </select>
                    {updatingRideId === ride.id && (
                      <div className="updating-indicator">
                        <div className="small-spinner"></div>
                      </div>
                    )}
                    {ride.status === 'COMPLETED' && (
                      <div className="completed-info">
                        ℹ️ Tamamlanan yolculuğun durumu değiştirilemez
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => loadRideRequests(ride.id)}
                    className="btn-secondary"
                    style={{ marginTop: '10px' }}
                  >
                    📋 Talepleri Görüntüle
                  </button>

                  {selectedRideId === ride.id && selectedRideRequests.length > 0 && (
                    <div className="ride-requests-section">
                      <h4 style={{ marginTop: '15px', marginBottom: '10px' }}>Gelen Talepler</h4>
                      {selectedRideRequests.map((request) => (
                        <div key={request.id} className="request-card">
                          <div className="request-info">
                            <p><strong>{request.guest?.firstName} {request.guest?.lastName}</strong></p>
                            <p style={{ fontSize: '0.9em', color: '#666' }}>
                              📧 {request.guest?.email} | 📞 {request.guest?.phone}
                            </p>
                            <p style={{ fontSize: '0.9em', color: '#667eea', fontWeight: 600 }}>
                              ⭐ {request.guest?.score?.toFixed(1) || '0.0'} / 5.0
                            </p>
                            <span className={`request-status-badge ${request.status.toLowerCase()}`}>
                              {getRequestStatusLabel(request.status)}
                            </span>
                          </div>
                          <div className="request-actions">
                            <button
                              onClick={() => handleRequestStatusUpdate(request.id, 'ACCEPTED')}
                              className="btn-accept"
                              disabled={request.status === 'ACCEPTED'}
                            >
                              ✓ Kabul Et
                            </button>
                            <button
                              onClick={() => handleRequestStatusUpdate(request.id, 'REJECTED')}
                              className="btn-reject"
                              disabled={request.status === 'REJECTED'}
                            >
                              ✗ Reddet
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRideId === ride.id && selectedRideRequests.length === 0 && (
                    <div className="info-message" style={{ marginTop: '10px' }}>
                      Bu yolculuğa henüz talep gelmemiş.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="my-requests-section">
          <h2>Gönderdiğim Talepler</h2>
          {myRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>Henüz hiçbir yolculuğa talepte bulunmadınız.</p>
              <p className="empty-subtitle">Ana sayfadan aktif yolculuklara göz atın!</p>
            </div>
          ) : (
            <div className="requests-list">
              {myRequests.map((request) => (
                <div key={request.id} className="request-ride-card">
                  <div className="ride-route-info">
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '700', color: '#333' }}>
                      {request.ride.title}
                    </h4>
                    <div className="route-cities">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                        <span>📍 {request.ride.originAddress}</span>
                        <span>🎯 {request.ride.destinationAddress}</span>
                      </div>
                    </div>
                    <div className="ride-meta">
                      <span>🕒 {formatDateTime(request.ride.departTime)}</span>
                      <span className="price">₺{request.ride.price.toFixed(2)}</span>
                    </div>
                    <p style={{ marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
                      Sürücü: {request.ride.driver.firstName} {request.ride.driver.lastName} 
                      <span style={{ color: '#667eea', fontWeight: 600, marginLeft: '8px' }}>
                        ⭐ {request.ride.driver.score?.toFixed(1) || '0.0'}
                      </span>
                    </p>
                  </div>
                  <div className={`request-status-badge ${request.status.toLowerCase()}`}>
                    {getRequestStatusLabel(request.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

