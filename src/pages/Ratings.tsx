import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rateService } from '../api/rateService';
import { rideService } from '../api/rideService';
import { userService } from '../api/userService';
import { Rate, Ride, User } from '../types';
import './Ratings.css';

const Ratings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [myRatingsAsRated, setMyRatingsAsRated] = useState<Rate[]>([]);
  const [myRatingsAsRater, setMyRatingsAsRater] = useState<Rate[]>([]);
  const [ridesAsGuest, setRidesAsGuest] = useState<Ride[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [formData, setFormData] = useState({ score: 5, comment: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUserData();
    loadRatings();
    loadRidesAsGuest();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await userService.getAuthenticatedUser();
      setUser(userData);
    } catch (err) {
      console.error('Kullanıcı bilgileri yüklenemedi:', err);
    }
  };

  const loadRatings = async () => {
    try {
      const [asRated, asRater] = await Promise.all([
        rateService.getMyRatesAsRated(),
        rateService.getMyRatesAsRater(),
      ]);
      setMyRatingsAsRated(asRated);
      setMyRatingsAsRater(asRater);
    } catch (err) {
      console.error('Yorumlar yüklenemedi:', err);
    }
  };

  const loadRidesAsGuest = async () => {
    try {
      const rides = await rideService.getRidesAsGuest();
      // Sadece tamamlanmış yolculukları göster
      const completedRides = rides.filter(ride => ride.status === 'COMPLETED');
      setRidesAsGuest(completedRides);
    } catch (err) {
      console.error('Misafir olduğum yolculuklar yüklenemedi:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRide) {
      setError('Lütfen değerlendirmek istediğiniz yolculuğu seçin.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await rateService.createRate({
        score: formData.score,
        comment: formData.comment,
        targetUserId: selectedRide.driver.id,
        targetRideId: selectedRide.id,
      });
      setSuccess('Değerlendirme başarıyla eklendi!');
      setFormData({ score: 5, comment: '' });
      setSelectedRide(null);
      setShowCreateForm(false);
      await Promise.all([loadUserData(), loadRatings(), loadRidesAsGuest()]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Değerlendirme eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRideSelect = (ride: Ride) => {
    setSelectedRide(ride);
    setError('');
  };

  const renderStars = (score: number) => {
    return '⭐'.repeat(score);
  };

  const isRideAlreadyRated = (ride: Ride) => {
    return myRatingsAsRater.some(rate => rate.ride.id === ride.id);
  };

  const RateCard = ({ rate, showRater }: { rate: Rate; showRater: boolean }) => {
    const displayUser = showRater ? rate.raterUser : rate.ratedUser;
    return (
      <div className="rate-card">
        <div className="rate-header">
          <div>
            <h4>{displayUser.firstName} {displayUser.lastName}</h4>
            <p className="rate-email">{displayUser.email}</p>
          </div>
          <div className="rate-score">
            <span className="stars">{renderStars(rate.score)}</span>
            <span className="score-value">{rate.score}/5</span>
          </div>
        </div>
        <div className="rate-ride-info">
          <span className="ride-route-small">
            📍 {rate.ride.originAddress} → 🎯 {rate.ride.destinationAddress}
          </span>
          <span className="ride-date-small">🕒 {formatDateTime(rate.ride.departTime)}</span>
        </div>
        <p className="rate-comment">"{rate.comment}"</p>
        <p className="rate-date">{formatDateTime(rate.createdAt)}</p>
      </div>
    );
  };

  return (
    <div className="ratings-container">
      <nav className="ratings-nav">
        <Link to="/" className="site-logo">
          <h1>Benimle İşe Gel</h1>
        </Link>
        <Link to="/dashboard" className="btn-secondary">
          Dashboard'a Dön
        </Link>
      </nav>

      <div className="ratings-content">
        <div className="ratings-header">
          <h2>Değerlendirmeler</h2>
          <div className="user-score">
            <span>Skorunuz: ⭐ {user?.score?.toFixed(1) || '0.0'} / 5.0</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="create-rate-section">
          {!showCreateForm ? (
            <div>
              {ridesAsGuest.length === 0 ? (
                <div className="info-message">
                  Değerlendirme yapabilmek için tamamlanmış bir yolculukta misafir olmanız gerekiyor.
                </div>
              ) : (
                <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                  + Yeni Değerlendirme Yap
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rate-form">
              <h3>Yeni Değerlendirme</h3>
              
              <div className="form-group">
                <label>Tamamlanan Yolculuklarım</label>
                <div className="rides-selection">
                  {ridesAsGuest.map((ride) => {
                    const alreadyRated = isRideAlreadyRated(ride);
                    return (
                      <div
                        key={ride.id}
                        className={`ride-select-card ${selectedRide?.id === ride.id ? 'selected' : ''} ${alreadyRated ? 'disabled' : ''}`}
                        onClick={() => !alreadyRated && handleRideSelect(ride)}
                      >
                        <div className="ride-select-header">
                          <div className="ride-select-route">
                            <span className="city">📍 {ride.originAddress}</span>
                            <span className="arrow">→</span>
                            <span className="city">🎯 {ride.destinationAddress}</span>
                          </div>
                          <span className="ride-select-date">🕒 {formatDateTime(ride.departTime)}</span>
                        </div>
                        <div className="ride-select-driver">
                          <span className="driver-info">
                            👤 {ride.driver.firstName} {ride.driver.lastName}
                          </span>
                          <span className="driver-score">⭐ {ride.driver.score?.toFixed(1) || '0.0'}</span>
                        </div>
                        {alreadyRated && (
                          <div className="already-rated-badge">✓ Değerlendirildi</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedRide && (
                <>
                  <div className="form-group">
                    <label>Puan (1-5)</label>
                    <div className="score-selector">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`score-btn ${formData.score === s ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, score: s })}
                        >
                          {renderStars(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Yorumunuz</label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      required
                      placeholder="Deneyiminizi paylaşın..."
                      rows={4}
                    />
                  </div>
                </>
              )}

              <div className="form-buttons">
                <button type="submit" className="btn-primary" disabled={loading || !selectedRide}>
                  {loading ? 'Gönderiliyor...' : 'Gönder'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ score: 5, comment: '' });
                    setSelectedRide(null);
                    setError('');
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="ratings-grid">
          <div className="ratings-column">
            <h3>Aldığım Değerlendirmeler ({myRatingsAsRated.length})</h3>
            {myRatingsAsRated.length === 0 ? (
              <div className="empty-state">
                <p>Henüz değerlendirme almadınız.</p>
              </div>
            ) : (
              myRatingsAsRated.map((rate) => (
                <RateCard key={rate.id} rate={rate} showRater={true} />
              ))
            )}
          </div>

          <div className="ratings-column">
            <h3>Verdiğim Değerlendirmeler ({myRatingsAsRater.length})</h3>
            {myRatingsAsRater.length === 0 ? (
              <div className="empty-state">
                <p>Henüz değerlendirme yapmadınız.</p>
              </div>
            ) : (
              myRatingsAsRater.map((rate) => (
                <RateCard key={rate.id} rate={rate} showRater={false} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ratings;

