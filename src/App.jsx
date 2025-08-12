import { useState, useEffect, useRef } from 'react';
import './App.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useCreateDeal } from './hooks/useCreateDeal';
import { TOKENS_BY_CHAIN, getDefaultTokenForChain } from './lib/constants';
import { useManageDeal } from './hooks/useManageDeal';
import { useConsultDeal } from './hooks/useConsultDeal';

function App() {
  // --- Estado de red y tokens por red (DENTRO del componente) ---
  const [chainId, setChainId] = useState(8453);

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum?.chainId) {
          setChainId(parseInt(window.ethereum.chainId, 16));
        }
      } catch {}
    };
    init();

    const handler = (cid) => setChainId(parseInt(cid, 16));
    window.ethereum?.on('chainChanged', handler);
    return () => window.ethereum?.removeListener('chainChanged', handler);
  }, []);

  const tokenAddresses = TOKENS_BY_CHAIN[chainId] || TOKENS_BY_CHAIN[8453];
  const [token, setToken] = useState(getDefaultTokenForChain(chainId));
  useEffect(() => {
    setToken(getDefaultTokenForChain(chainId));
  }, [chainId]);

  // Explorer dinámico (Base / Arbitrum)
  const explorerBase = chainId === 42161 ? 'https://arbiscan.io' : 'https://basescan.org';

  const [activeTab, setActiveTab] = useState('crear');
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [dealId, setDealId] = useState('');
  const [dealInfo, setDealInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  const { createDeal, txHash } = useCreateDeal();
  const { payDeal, releaseDeal, cancelDeal, txHash: manageTxHash } = useManageDeal();
  const { consultDeal, dealInfo: consultedDeal, loading: consultLoading } = useConsultDeal();

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particleCount = 100;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#E8EBF022';
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleCreate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    try {
      await createDeal({ selectedToken: token, amount });
    } catch (e) {
      alert(e?.message || String(e));
      console.error(e);
    }
  };

  const handleConsult = async () => {
    if (!dealId || isNaN(parseInt(dealId))) return;
    await consultDeal(parseInt(dealId));
  };

  const isActionButtonDisabled = (tab) => {
    const emailValid = email.trim() !== '' && confirmEmail.trim() !== '' && email === confirmEmail;

    if (tab === 'crear') {
      return !amount || parseFloat(amount) <= 0 || !emailValid;
    } else if (tab === 'consultar') {
      return !dealId || isNaN(parseInt(dealId));
    } else if (['pagar', 'liberar', 'cancelar'].includes(tab)) {
      return !orderId || isNaN(parseInt(orderId)) || !emailValid;
    } else {
      return true;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'consultar':
        return (
          <div className="tab-content">
            <div className="input-section">
              <input
                type="text"
                id="consultDealIdInput"
                className="main-input"
                placeholder="Ingresar ID del Trato"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
              />
            </div>
            <button
              className="action-button"
              id="consultDealBtn"
              disabled={isActionButtonDisabled('consultar')}
              onClick={handleConsult}
            >
              Consultar Trato
            </button>

            {consultedDeal && (
              <div className="deal-info">
                <h3>Detalles del Trato #{consultedDeal.id}</h3>
                <p>Monto: {consultedDeal.amount} USDC</p>
                <p>Vendedor: {consultedDeal.seller}</p>
                <p>Comprador: {consultedDeal.buyer}</p>
                <p>Estado: {consultedDeal.status}</p>
              </div>
            )}
          </div>
        );
      case 'crear':
        return (
          <div className="tab-content">
            <div className="input-section">
              <div className="input-row">
                <div className="main-input-container">
                  <input
                    type="number"
                    id="createAmountInput"
                    className="main-input"
                    placeholder="Ingresar cantidad"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <button type="button" id="createTokenSelect" className="currency-selector-button">
                  USDC
                </button>
              </div>
            </div>
            <button
              className="action-button"
              id="createOrderBtn"
              disabled={isActionButtonDisabled('crear')}
              onClick={handleCreate}
            >
              Crear Orden
            </button>
            {txHash && (
              <p className="tx-message">
                Tx enviada:{' '}
                <a href={`${explorerBase}/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  Ver
                </a>
              </p>
            )}
          </div>
        );
      case 'pagar':
      case 'liberar':
      case 'cancelar':
        const buttonText = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        return (
          <div className="tab-content">
            <div className="input-section">
              <input
                type="text"
                id={`${activeTab}OrderIdInput`}
                className="main-input"
                placeholder="Ingresar ID de Orden"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <button
              className="action-button"
              id={`${activeTab}OrderBtn`}
              disabled={isActionButtonDisabled(activeTab)}
              
              onClick={async () => {
                try {
                  const id = parseInt(orderId);
                  if (isNaN(id)) {
                    alert('ID inválido');
                    return;
                  }
                  if (activeTab === 'pagar')   await payDeal(id);
                  if (activeTab === 'liberar') await releaseDeal(id);
                  if (activeTab === 'cancelar') await cancelDeal(id);
                } catch (e) {
                  alert(e?.message || String(e));
                  console.error(e);
                }
              }}
            >
              {buttonText} Orden
            </button>
            {manageTxHash && (
              <p className="tx-message">
                Tx enviada:{' '}
                <a href={`${explorerBase}/tx/${manageTxHash}`} target="_blank" rel="noopener noreferrer">
                  Ver
                </a>
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="main-container">
      <canvas ref={canvasRef} id="bgCanvas"></canvas>

      <div className="connect-button-container">
        <ConnectButton />
      </div>

      <div className="title">Abi.dil</div>
      <p className="subtitle">Confía. Crea. Transfiere.</p>

      <div className="card">
        <div className="tab-navigation">
          {['crear', 'pagar', 'liberar', 'cancelar', 'consultar'].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${tab === activeTab ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setAmount('');
                setOrderId('');
                setDealId('');
                setDealInfo(null);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab !== 'consultar' && (
          <div className="email-section">
            <input
              type="email"
              className="email-input"
              placeholder="Ingresar correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="email"
              className="email-input"
              placeholder="Confirmar correo electrónico"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
        )}

        {renderContent()}
      </div>

      <div className="footer">
        <p>© 2025 Abi.dil. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

export default App;
