import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <nav className="home-nav">
        <h1>Benimle İşe Gel</h1>
        <div className="nav-buttons">
          <Link to="/login" className="btn-primary">Giriş Yap</Link>
          <Link to="/signup" className="btn-secondary">Kayıt Ol</Link>
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
