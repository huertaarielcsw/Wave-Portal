/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './utils/WavePortal.json';
import LoadingIndicator from './Components/LoadingIndicator';
import twitterLogo from './assets/twitter-logo.svg';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [showToast, setShowToast] = useState('');
  const [mintState, setMintState] = useState('');
  const [allWaves, setAllWaves] = useState([]);
  const [waveMsg, setWaveMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const TWITTER_HANDLE = 'huertaarielcsw';
  const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

  const contractAddress = '0xCCCc6F0832A2a69B06967E60d5eBccb028c6a6b3';
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have metamask!');
        return;
      } else {
        console.log('We have the ethereum object', ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count...', count.toNumber());

        const waveTxn = await wavePortalContract.wave(waveMsg, {
          gasLimit: 300000,
        });
        console.log('Mining...', waveTxn.hash);
        setMintState('mining');

        await waveTxn.wait();
        console.log('Mined -- ', waveTxn.hash);
        setMintState('mined');

        count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count...', count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setMintState('mined');
      if (currentAccount === '') {
        setToastMsg('Connect your wallet.');
      } else {
        setToastMsg('Must wait 5 minutes.');
      }
      setShowToast('show');
      setTimeout(() => {
        setShowToast('hide');
      }, 5000);
    }
  };

  const handleInputChange = (event) => {
    setWaveMsg(event.target.value);
  };

  const handleInputSubmit = (event) => {
    event.preventDefault();
    console.log('Wave message' + waveMsg);
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message, won) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
      if (won === 'yes') {
        setToastMsg('You have earned 0.0001 ether.');
        setShowToast('show');
        setTimeout(() => {
          setShowToast('hide');
        }, 5000);
      }
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div id="toast" className={showToast}>
          <div id="desc">{toastMsg}</div>
        </div>
        <div className="header-container">
          <p className="header gradient-text"> Wave Portal!</p>
          <p className="header"> 👋</p>
          <p className="sub-text">
            Hey, my name is Ariel and I'm studying Computer Science so that's
            pretty cool right?
          </p>
          <p className="sub-text">
            {' '}
            Connect your Ethereum wallet and tell your favorite Disney movie.
          </p>
          <div
            style={{
              backgroundColor: '#0d1116',
              marginRight: '15px',
              padding: '16px',
            }}
          >
            <form onSubmit={handleInputSubmit}>
              <label>
                <input
                  type="text"
                  value={waveMsg}
                  onChange={handleInputChange}
                />
              </label>
            </form>
          </div>
          <div>
            <button className="cta-button wave-button" onClick={wave}>
              Wave at Me
            </button>
            <p className="sub-text"> Total waves: {allWaves.length}</p>
          </div>
        </div>
        <div>
          {mintState === 'mining' && (
            <div className="loading-indicator">
              <LoadingIndicator />
            </div>
          )}
        </div>
        <div>
          {!currentAccount && (
            <button
              className="cta-button connect-wallet-button"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}

          {allWaves.map((wave, index) => {
            return (
              <div
                key={index}
                style={{
                  backgroundColor: '#0d1116',
                  marginTop: '16px',
                  padding: '8px',
                  marginRight: '240px',
                  marginLeft: '240px',
                  background:
                    '-webkit-linear-gradient(left, #20b2aa 30%, #00ffff 60%)',
                  backgroundClip: 'text',
                }}
              >
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>
            );
          })}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >{`@${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
}
