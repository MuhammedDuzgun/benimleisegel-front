import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../api/vehicleService';
import { userService } from '../api/userService';
import { rideService } from '../api/rideService';
import { rideRequestService } from '../api/rideRequestService';
import { User, Ride, RideStatus, RideRequest, RideRequestStatus } from '../types';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import RideMap from '../components/RideMap';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
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
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleSuccess, setVehicleSuccess] = useState('');
  const [rideError, setRideError] = useState('');
  const [rideSuccess, setRideSuccess] = useState('');

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
      setVehicleError('Kullanıcı bilgileri yüklenemedi.');
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
    setRideError('');
    setRideSuccess('');

    try {
      await rideRequestService.updateRideRequestStatus(requestId, { status: newStatus });
      setRideSuccess(`Talep durumu "${getRequestStatusLabel(newStatus)}" olarak güncellendi!`);
      if (selectedRideId) {
        await loadRideRequests(selectedRideId);
      }
      setTimeout(() => setRideSuccess(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Talep durumu güncellenirken bir hata oluştu.';
      setRideError(errorMessage);
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        await userService.deleteUser();
        logout();
        navigate('/login');
      } catch (err: any) {
        setVehicleError('Hesap silinirken bir hata oluştu.');
      }
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleError('');
    setVehicleSuccess('');
    setLoading(true);

    try {
      await vehicleService.addVehicle(vehicleData);
      setVehicleSuccess('Araç başarıyla eklendi!');
      setVehicleData({ plate: '', brand: '', model: '' });
      setShowVehicleForm(false);
      await fetchUserData();
      setTimeout(() => setVehicleSuccess(''), 3000);
    } catch (err: any) {
      setVehicleError(err.response?.data?.message || 'Araç eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (window.confirm('Aracınızı silmek istediğinizden emin misiniz?')) {
      try {
        await vehicleService.deleteVehicle();
        setVehicleSuccess('Araç başarıyla silindi!');
        await fetchUserData();
        setTimeout(() => setVehicleSuccess(''), 3000);
      } catch (err: any) {
        setVehicleError('Araç silinirken bir hata oluştu.');
      }
    }
  };

  const handleRideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRideError('');
    setRideSuccess('');
    setLoading(true);

    try {
      if (!rideData.originLatitude || !rideData.originLongitude || 
          !rideData.destinationLatitude || !rideData.destinationLongitude ||
          rideData.originLatitude === 0 || rideData.originLongitude === 0 ||
          rideData.destinationLatitude === 0 || rideData.destinationLongitude === 0) {
        setRideError('Lütfen geçerli başlangıç ve varış adreslerini seçin. Adresler otomatik tamamlanmalı ve koordinatlar belirlenmiş olmalı.');
        setLoading(false);
        return;
      }

      if (!rideData.distanceInMeters || !rideData.durationInSeconds) {
        setRideError('Lütfen rota hesaplanana kadar bekleyin. Harita üzerinde mesafe ve süre görünmelidir.');
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
      setRideSuccess('Yolculuk başarıyla oluşturuldu!');
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
      setShowRideForm(false);
      await loadUserRides();
      setTimeout(() => setRideSuccess(''), 3000);
    } catch (err: any) {
      setRideError(err.response?.data?.message || 'Yolculuk oluşturulurken bir hata oluştu.');
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

    setRideError('');
    setRideSuccess('');
    setUpdatingRideId(rideId);

    try {
      await rideService.updateRideStatus(rideId, { status: newStatus });
      setRideSuccess(`Yolculuk durumu "${statusLabel}" olarak güncellendi!`);
      await loadUserRides();
      setTimeout(() => setRideSuccess(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Durum güncellenirken bir hata oluştu.';
      setRideError(errorMessage);
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
          
          {vehicleError && <div className="error-message">{vehicleError}</div>}
          {vehicleSuccess && <div className="success-message">{vehicleSuccess}</div>}

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
                    setVehicleError('');
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
          
          {rideError && <div className="error-message">{rideError}</div>}
          {rideSuccess && <div className="success-message">{rideSuccess}</div>}

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
                    placeholder="Örn: İşe Gidiş - Mardin-Nusaybin"
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

              {rideData.originLatitude && rideData.originLongitude && 
               rideData.destinationLatitude && rideData.destinationLongitude && (
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
              )}

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
                  <input
                    type="number"
                    id="price"
                    value={rideData.price || ''}
                    onChange={(e) => setRideData({ ...rideData, price: parseFloat(e.target.value) })}
                    required
                    placeholder="350.50"
                    step="0.01"
                    min="0"
                  />
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
                    setRideError('');
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

