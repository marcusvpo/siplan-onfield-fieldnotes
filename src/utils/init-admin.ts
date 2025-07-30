import { supabase } from "@/integrations/supabase/client";

export const initializeAdmin = async () => {
  try {
    console.log("[INIT ADMIN] Calling create-admin function...");
    
    const { data, error } = await supabase.functions.invoke('create-admin');
    
    if (error) {
      console.error("[INIT ADMIN] Error:", error);
      throw error;
    }
    
    console.log("[INIT ADMIN] Success:", data);
    return data;
  } catch (error) {
    console.error("[INIT ADMIN] Failed:", error);
    throw error;
  }
};

// Call this function once to create the admin user
// You can call this from the browser console: window.initAdmin()
if (typeof window !== 'undefined') {
  (window as any).initAdmin = initializeAdmin;
}