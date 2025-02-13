import { SignClient } from '@walletconnect/sign-client';

const WALLETCONNECT_PROJECT_ID = "cb50c6ce09eb80fc05f7d2a686158b07";
const RELAY_URL = "wss://relay.walletconnect.com";

async function analyzePolkaswapURI(uri) {
  const signClient = await SignClient.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    relayUrl: RELAY_URL,
  });

  console.log("WalletConnect Client Initialized");

  signClient.core.relayer.on("connect", () => {
    console.log("Relayer connected 🛜");
  });

  signClient.core.relayer.on("disconnect", () => {
    console.error("Relayer disconnected 🚨");
  });

  signClient.core.relayer.on("error", (error) => {
    console.error("Relayer error ⚠️:", error.message);
  });

  signClient.on("*", (event, data) => {
    console.log(`Event: ${event}`, JSON.stringify(data, null, 2)); // Вывод всех событий с детализированным содержимым
  });

  // Слушайте предложения сессий
  signClient.on("session_proposal", (proposal) => {
    console.log("Session Proposal:", JSON.stringify(proposal, null, 2)); // Детализированный вывод объекта
  });

  try {
    // Подключение к URI
    await signClient.pair({ uri });
    console.log("Connected to URI:", uri);
  } catch (error) {
    console.error("Error connecting to URI:", error);
  }
}

const polkaswapURI = "wc:ceed9584cd7ec476deab9b6f81c9febc1a7e8433473629c05e525a0eba356672@2?expiryTimestamp=1736217105&relay-protocol=irn&symKey=06dc5787e6348da2d20693cb4eec9d052fc148dbc6163772b5ef0cd1bdea5aea";
analyzePolkaswapURI(polkaswapURI);
