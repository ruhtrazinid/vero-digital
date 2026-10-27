// js/store.js
const SUPABASE_URL = "https://orbnoarfqqizqqwspsgj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYm5vYXJmcXFpenFxd3Nwc2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMjYwMzMsImV4cCI6MjEwODYwMjAzM30.-Z4ZFKFn71rsgoxNdsNbIbTDU9lGezVY5aBcI8oaSoA";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// AUTH
async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// LOJAS MULTI-TENANT
async function getStoreByUserId(userId) {
  const { data, error } = await supabaseClient
    .from("comercios")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar comércio por user_id:", error.message);
    return null;
  }
  return data;
}

async function getStoreBySlug(slug) {
  const { data, error } = await supabaseClient
    .from("comercios")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar comércio por slug:", error.message);
    return null;
  }
  return data;
}

async function createStore(storeData) {
  const { data, error } = await supabaseClient
    .from("comercios")
    .insert([storeData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateStoreData(storeId, fields) {
  const { data, error } = await supabaseClient
    .from("comercios")
    .update({
      nome: fields.nome,
      segmento: fields.segmento,
      whatsapp: fields.whatsapp,
      taxa_entrega: fields.taxa_entrega,
      cor_tema: fields.cor_tema,
      endereco: fields.endereco
    })
    .eq("id", storeId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// PRODUTOS
async function getProducts(comercioId) {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*")
    .eq("comercio_id", comercioId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos:", error.message);
    return [];
  }
  return data;
}

async function addProduct(product) {
  const { data, error } = await supabaseClient
    .from("produtos")
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateProductData(id, fields) {
  const { data, error } = await supabaseClient
    .from("produtos")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function toggleProductStatus(id, currentStatus) {
  const { error } = await supabaseClient
    .from("produtos")
    .update({ disponivel: !currentStatus })
    .eq("id", id);

  if (error) throw error;
}

async function deleteProductById(id) {
  const { error } = await supabaseClient
    .from("produtos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

async function uploadProductImage(file) {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `itens/${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("produtos")
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage
    .from("produtos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
