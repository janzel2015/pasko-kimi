// =====================================
// ADMIN CONFIGURATION
// =====================================
// Change this to your actual Supabase config (or link config.js)
const SUPABASE_URL = 'https://vllqavcfqydtscbdrcex.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Paste your ANON key here

// Change this to your secret password!
const ADMIN_PASSWORD = 'pasko-admin-2026'; 

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================
// LOGIN & LOGOUT
// =====================================
function login() {
  const key = document.getElementById('adminKeyInput').value;
  if (key === ADMIN_PASSWORD) {
    localStorage.setItem('pasko_admin_logged_in', 'true');
    checkAuth();
  } else {
    alert('Maling password!');
  }
}

function logout() {
  localStorage.removeItem('pasko_admin_logged_in');
  checkAuth();
}

function checkAuth() {
  const isLoggedIn = localStorage.getItem('pasko_admin_logged_in') === 'true';
  document.getElementById('loginScreen').style.display = isLoggedIn ? 'none' : 'block';
  document.getElementById('dashboard').style.display = isLoggedIn ? 'block' : 'none';
  
  if (isLoggedIn) loadOrders('pending', document.querySelector('.tab-btn'));
}

// Check auth on page load
checkAuth();

// =====================================
// LOAD ORDERS
// =====================================
async function loadOrders(status, btnElement) {
  // Update active tab UI
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  const list = document.getElementById('ordersList');
  list.innerHTML = '<p>Loading orders...</p>';

  const { data, error } = await sb
    .from('orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = '<p>No orders found in this category.</p>';
    return;
  }

  list.innerHTML = '';
  data.forEach(order => {
    // Get public URL for the uploaded photo
    const { data: photoData } = sb.storage.from('uploads').getPublicUrl(order.photo_url);
    const photoUrl = photoData?.publicUrl || '';

    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <img src="${photoUrl}" class="order-image" alt="Photo">
      <div class="order-details">
        <p><b>Order Code:</b> ${order.order_code}</p>
        <p><b>Customer:</b> ${order.customer_name} (${order.contact_info})</p>
        <p><b>Package:</b> ${order.package}</p>
        <p><b>Status:</b> <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span></p>
        <p style="font-size: 12px; color: #666;">Date: ${new Date(order.created_at).toLocaleString()}</p>
      </div>
      <div class="actions">
        ${order.status === 'pending' ? `<button class="btn btn-approve" onclick="updateStatus('${order.id}', 'approved')">✅ Approve Payment</button>` : ''}
        ${order.status === 'approved' ? `<button class="btn btn-complete" onclick="completeOrder('${order.id}')">🎁 Mark as Completed</button>` : ''}
        ${order.status === 'completed' ? `<p style="color:green; font-weight:bold; margin:0;">Ready to Download</p>` : ''}
        <button class="btn btn-reject" onclick="updateStatus('${order.id}', 'rejected')">❌ Reject</button>
      </div>
    `;
    list.appendChild(card);
  });
}

// =====================================
// UPDATE STATUS (Approve/Reject)
// =====================================
async function updateStatus(orderId, newStatus) {
  if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

  const { error } = await sb
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
    alert('Error updating order: ' + error.message);
  } else {
    alert('Order updated successfully!');
    loadOrders(newStatus, document.querySelector(`.tab-btn.active`)); 
  }
}

// =====================================
// COMPLETE ORDER (Provide Final Link)
// =====================================
async function completeOrder(orderId) {
  // In a real server-side render, this URL is generated automatically.
  // For now, we ask the admin to paste the final MP4 link.
  const mp4Url = prompt("Paste the final MP4 Video URL here (from Supabase Storage or server):");
  
  if (!mp4Url) return; // User cancelled

  const { error } = await sb
    .from('orders')
    .update({ 
      status: 'completed',
      final_file_url: mp4Url 
    })
    .eq('id', orderId);

  if (error) {
    alert('Error completing order: ' + error.message);
  } else {
    alert('Order marked as completed! The user\'s Pre-Link will now auto-download.');
    loadOrders('approved', document.querySelector(`.tab-btn.active`)); 
  }
}
