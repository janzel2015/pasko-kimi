import { getAdmin } from "./supabase.js";
export const PRIVATE_BUCKET = process.env.SUPABASE_BUCKET_PRIVATE || process.env.SUPABASE_BUCKET || "uploads";
export const RESULTS_BUCKET = process.env.SUPABASE_BUCKET_RESULTS || PRIVATE_BUCKET || "uploads";
export async function uploadPrivate(buffer, path, contentType, bucket=PRIVATE_BUCKET){
  const supabase=getAdmin();
  const {error}=await supabase.storage.from(bucket).upload(path, buffer, {contentType, upsert:true});
  if(error) throw error;
  return path;
}
export async function createSignedUrl(path, expires=3600, bucket=PRIVATE_BUCKET){
  try{
    const supabase=getAdmin();
    const {data, error}=await supabase.storage.from(bucket).createSignedUrl(path, expires);
    if(error) return null;
    return data.signedUrl;
  }catch{ return null; }
}
export async function downloadPrivate(path, bucket=PRIVATE_BUCKET){
  const supabase=getAdmin();
  const {data, error}=await supabase.storage.from(bucket).download(path);
  if(error) throw error;
  return data;
}
