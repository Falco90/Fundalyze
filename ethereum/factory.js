import web3 from "./web3";
import compiledFactory from "./build/CampaignFactory.json";

const instance = new web3.eth.Contract(
  JSON.parse(compiledFactory.interface),
  "0x15a42df6b7427E6E4368Bf042621d9c8513719ab"
);

export default instance;
