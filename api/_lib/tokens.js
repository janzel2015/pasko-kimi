import crypto from "crypto";
export function genOrderCode(){ return "PASKO-"+crypto.randomBytes(3).toString("hex").toUpperCase(); }
export function genDeliveryToken(){ return crypto.randomBytes(32).toString("hex"); }
