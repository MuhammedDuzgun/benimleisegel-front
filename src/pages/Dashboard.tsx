import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../api/vehicleService';
import { userService } from '../api/userService';
import { User } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleData, setVehicleData] = useState({ plate: '', brand: '', model: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await userService.getAuthenticatedUser();
      setUser(userData);
    } catch (err: any) {
      setError('Kullanıcı bilgileri yüklenemedi.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Hesabınızı silmek istediğinizden emin misiniz?')) {
      try {
        await userService.deleteUser();
        logout();
        navigate('/login');
      } catch (err: any) {
        setError('Hesap silinirken bir hata oluştu.');
      }
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await vehicleService.addVehicle(vehicleData);
      setSuccess('Araç başarıyla eklendi!');
      setVehicleData({ plate: '', brand: '', model: '' });
      setShowVehicleForm(false);
      await fetchUserData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Araç eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (window.confirm('Aracınızı silmek istediğinizden emin misiniz?')) {
      try {
        await vehicleService.deleteVehicle();
        setSuccess('Araç başarıyla silindi!');
        await fetchUserData();
      } catch (err: any) {
        setError('Araç silinirken bir hata oluştu.');
      }
    }
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <h1>Benimle İşe Gel</h1>
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
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

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
                  onClick={() => setShowVehicleForm(false)}
                  className="btn-secondary"
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

