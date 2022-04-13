import web3 from "./web3";
import Campaign from "../ethereum/build/Campaign.json";

const campaignInstance = (address) => {
  return new web3.eth.Contract(JSON.parse(Campaign.interface), address);
};

export default campaignInstance;
