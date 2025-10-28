import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../api/vehicleService';
import { userService } from '../api/userService';
import { rideService } from '../api/rideService';
import { User, Ride, RideStatus } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showRideForm, setShowRideForm] = useState(false);
  const [vehicleData, setVehicleData] = useState({ plate: '', brand: '', model: '' });
  const [rideData, setRideData] = useState({
    originCity: '',
    originDistrict: '',
    destinationCity: '',
    destinationDistrict: '',
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
      const submitData = {
        ...rideData,
        departTime: new Date(rideData.departTime).toISOString(),
      };
      await rideService.createRide(submitData);
      setRideSuccess('Yolculuk başarıyla oluşturuldu!');
      setRideData({
        originCity: '',
        originDistrict: '',
        destinationCity: '',
        destinationDistrict: '',
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
        <button onClick={handleLogout} className="btn-secondary">
          Çıkış Yap
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="user-section">
          <h2>Hoş Geldiniz, {user?.firstName}!</h2>
          <div className="user-info">
            <p><strong>Ad Soyad:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>E-posta:</strong> {user?.email}</p>
            <p><strong>Telefon:</strong> {user?.phone}</p>
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
                <div className="form-group">
                  <label htmlFor="originCity">Başlangıç Şehri</label>
                  <input
                    type="text"
                    id="originCity"
                    value={rideData.originCity}
                    onChange={(e) => setRideData({ ...rideData, originCity: e.target.value })}
                    required
                    placeholder="İstanbul"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="originDistrict">Başlangıç İlçesi</label>
                  <input
                    type="text"
                    id="originDistrict"
                    value={rideData.originDistrict}
                    onChange={(e) => setRideData({ ...rideData, originDistrict: e.target.value })}
                    required
                    placeholder="Kadıköy"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="destinationCity">Varış Şehri</label>
                  <input
                    type="text"
                    id="destinationCity"
                    value={rideData.destinationCity}
                    onChange={(e) => setRideData({ ...rideData, destinationCity: e.target.value })}
                    required
                    placeholder="Ankara"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="destinationDistrict">Varış İlçesi</label>
                  <input
                    type="text"
                    id="destinationDistrict"
                    value={rideData.destinationDistrict}
                    onChange={(e) => setRideData({ ...rideData, destinationDistrict: e.target.value })}
                    required
                    placeholder="Çankaya"
                  />
                </div>
              </div>

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
                      originCity: '',
                      originDistrict: '',
                      destinationCity: '',
                      destinationDistrict: '',
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
                      <div className="route-cities">
                        <span className="city">{ride.originCity} ({ride.originDistrict})</span>
                        <span className="arrow">→</span>
                        <span className="city">{ride.destinationCity} ({ride.destinationDistrict})</span>
                      </div>
                      <div className="ride-meta">
                        <span>🕒 {formatDateTime(ride.departTime)}</span>
                        <span className="price">₺{ride.price.toFixed(2)}</span>
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
                      disabled={updatingRideId === ride.id}
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

