/**
 * 主页认证与会员模块（与全站 5 个子站共享 GameTogether Supabase 数据库）
 */

const SUPABASE_URL = 'https://szeedpcuharbupkjrnob.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZWVkcGN1aGFyYnVwa2pybm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTY3MDAsImV4cCI6MjA4ODEzMjcwMH0.7Qhchq8-NJG_Yqpx40r2idwt9iN98Hg63cHWIZ8lMTY';

let supabaseClient = null;
try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.error('Supabase 初始化失败:', e);
}

let currentUser = null;
let currentUserProfile = null;

window.showToast = function (msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = {
        success: 'border-green-500/50 bg-dark-light/95 text-green-400',
        error: 'border-red-500/50 bg-dark-light/95 text-red-400',
        warning: 'border-yellow-500/50 bg-dark-light/95 text-yellow-400',
        info: 'border-blue-500/50 bg-dark-light/95 text-blue-400'
    };
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl border ${colors[type] || colors.info} backdrop-blur-md transform translate-x-full transition-all duration-300 shadow-lg pointer-events-auto`;
    toast.innerHTML = `<i class="fa ${icons[type] || icons.info} text-base"></i><span class="text-sm font-medium">${msg}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-x-full'));
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

function setButtonLoading(btn, loader, isLoading, origText) {
    if (!btn) return;
    const span = btn.querySelector('span');
    btn.disabled = isLoading;
    if (loader) loader.classList.toggle('hidden', !isLoading);
    if (span) span.textContent = isLoading ? '处理中...' : origText;
}

function shakeForm(el) {
    if (!el) return;
    el.classList.add('shake-animation');
    setTimeout(() => el.classList.remove('shake-animation'), 500);
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    const backdrop = document.getElementById('auth-backdrop');
    const content = document.getElementById('auth-modal-content');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        backdrop?.classList.remove('opacity-0');
        content?.classList.remove('scale-95', 'opacity-0');
        content?.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    const backdrop = document.getElementById('auth-backdrop');
    const content = document.getElementById('auth-modal-content');
    if (!modal) return;
    backdrop?.classList.add('opacity-0');
    content?.classList.remove('scale-100', 'opacity-100');
    content?.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('login-form-element')?.reset();
        document.getElementById('register-form-element')?.reset();
        switchToLogin();
    }, 250);
}

function switchToLogin() {
    document.getElementById('tab-login')?.classList.add('tab-active');
    document.getElementById('tab-login')?.classList.remove('text-gray-400');
    document.getElementById('tab-register')?.classList.remove('tab-active');
    document.getElementById('tab-register')?.classList.add('text-gray-400');
    document.getElementById('login-form')?.classList.remove('hidden');
    document.getElementById('register-form')?.classList.add('hidden');
    const toggleText = document.getElementById('form-toggle-text');
    if (toggleText) {
        toggleText.innerHTML = '还没有账号？ <button type="button" id="show-register" class="text-neon-blue hover:underline font-medium">立即注册</button>';
        document.getElementById('show-register')?.addEventListener('click', switchToRegister);
    }
}

function switchToRegister() {
    document.getElementById('tab-register')?.classList.add('tab-active');
    document.getElementById('tab-register')?.classList.remove('text-gray-400');
    document.getElementById('tab-login')?.classList.remove('tab-active');
    document.getElementById('tab-login')?.classList.add('text-gray-400');
    document.getElementById('register-form')?.classList.remove('hidden');
    document.getElementById('login-form')?.classList.add('hidden');
    const toggleText = document.getElementById('form-toggle-text');
    if (toggleText) {
        toggleText.innerHTML = '已有账号？ <button type="button" id="show-login" class="text-neon-purple hover:underline font-medium">立即登录</button>';
        document.getElementById('show-login')?.addEventListener('click', switchToLogin);
    }
}

function openForgotPasswordModal() {
    document.getElementById('forgot-password-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'forgot-password-modal';
    modal.className = 'fixed inset-0 z-[70]';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="forgot-backdrop"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div class="glass-effect rounded-2xl w-full max-w-md p-6 text-center pointer-events-auto relative border border-white/15">
                <button id="close-forgot-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i class="fa fa-times"></i></button>
                <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center"><i class="fa fa-exclamation-triangle text-2xl text-white"></i></div>
                <h2 class="text-xl font-bold mb-2">账号安全提醒</h2>
                <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-5">
                    <p class="text-yellow-200 text-sm mb-3">为了您的账号安全，请联系管理员重置密码</p>
                    <div class="flex items-center gap-3 bg-dark/60 rounded-lg p-3">
                        <i class="fa fa-weixin text-green-400 text-2xl"></i>
                        <div class="text-left"><p class="text-gray-400 text-xs">管理员微信</p><p class="text-white font-mono font-bold">GameTogether1</p></div>
                        <button id="copy-wechat" class="ml-auto px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs">复制</button>
                    </div>
                </div>
                <button id="close-forgot-btn" class="w-full py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-sm">我知道了</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    document.getElementById('copy-wechat')?.addEventListener('click', () => {
        navigator.clipboard?.writeText('GameTogether1');
        window.showToast('已复制管理员微信', 'success');
    });
    document.getElementById('close-forgot-modal')?.addEventListener('click', close);
    document.getElementById('close-forgot-btn')?.addEventListener('click', close);
    document.getElementById('forgot-backdrop')?.addEventListener('click', close);
}

function openVIPModal() {
    document.getElementById('vip-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'vip-modal';
    modal.className = 'fixed inset-0 z-[70]';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="vip-backdrop"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div class="glass-effect rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row pointer-events-auto relative border border-white/15">
                <button id="closeVip" class="absolute top-4 right-4 z-10 text-gray-400 hover:text-white"><i class="fa fa-times text-lg"></i></button>
                <div class="p-8 md:w-1/2">
                    <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">开通全站会员</h2>
                    <div class="space-y-2.5 text-gray-300 text-sm">
                        <p>打赏一次，终身免费！</p>
                        <p>五大专区通用，全站资源无限畅享！</p>
                        <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3.5 mt-3"><p class="text-yellow-300 font-bold">微信扫码支付</p></div>
                    </div>
                    <button id="paidBtn" class="mt-7 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold text-white">我已支付</button>
                </div>
                <div class="md:w-1/2 bg-dark/50 p-6 flex items-center justify-center">
                    <img src="https://pub-1f2ba50106ed4026bd217cd777924d22.r2.dev/QR.png" alt="收款码" class="rounded-xl shadow-xl max-w-full">
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    document.getElementById('closeVip')?.addEventListener('click', close);
    document.getElementById('vip-backdrop')?.addEventListener('click', close);
    document.getElementById('paidBtn')?.addEventListener('click', () => { close(); openOrderInputModal(); });
}

function openOrderInputModal() {
    document.getElementById('order-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'order-modal';
    modal.className = 'fixed inset-0 z-[70]';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="orderBackdrop"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div id="order-box" class="glass-effect rounded-2xl w-full max-w-md p-6 text-center pointer-events-auto border border-white/15">
                <h2 class="text-xl font-bold mb-2">输入微信支付订单号</h2>
                <p class="text-xs text-gray-400 mb-4">微信 → 我 → 服务 → 钱包 → 账单</p>
                <input type="text" id="orderNumber" maxlength="32" class="w-full bg-transparent border-b border-gray-600 text-center text-lg tracking-wider text-white focus:outline-none focus:border-neon-blue font-mono py-2" placeholder="请输入32位订单号">
                <div class="flex justify-between mt-3 px-1" id="orderDots">${Array.from({ length: 32 }, () => '<div class="w-1.5 h-1.5 rounded-full bg-gray-700"></div>').join('')}</div>
                <p class="text-gray-400 text-xs mt-2"><span id="orderLen">0</span>/32</p>
                <div class="flex gap-3 mt-6">
                    <button id="cancelOrder" class="flex-1 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600">返回</button>
                    <button id="submitOrder" class="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 font-bold" disabled>提交</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);

    const input = document.getElementById('orderNumber');
    const dots = document.querySelectorAll('#orderDots div');
    const lenSpan = document.getElementById('orderLen');
    const submitBtn = document.getElementById('submitOrder');
    const close = () => modal.remove();

    input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 32);
        input.value = val;
        lenSpan.textContent = String(val.length);
        dots.forEach((dot, i) => {
            dot.classList.toggle('bg-green-500', i < val.length);
            dot.classList.toggle('bg-gray-700', i >= val.length);
        });
        submitBtn.disabled = val.length !== 32;
    });

    document.getElementById('cancelOrder')?.addEventListener('click', close);
    document.getElementById('orderBackdrop')?.addEventListener('click', close);

    submitBtn.addEventListener('click', async () => {
        const orderNo = input.value.trim();
        if (!/^\d{32}$/.test(orderNo) || orderNo.substring(10, 18) !== getTodayDateString()) {
            window.showToast('订单号无效，请检查当日32位订单号', 'error');
            shakeForm(document.getElementById('order-box'));
            return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = '验证中...';
        try {
            const { data: existing, error: checkError } = await supabaseClient
                .from('GameTogether')
                .select('id, order_id')
                .eq('order_id', orderNo)
                .maybeSingle();
            if (checkError) throw checkError;
            if (existing) {
                window.showToast('该订单号已被使用', 'error');
                shakeForm(document.getElementById('order-box'));
                submitBtn.disabled = false;
                submitBtn.textContent = '提交';
                return;
            }
            const { error } = await supabaseClient
                .from('GameTogether')
                .update({ is_member: true, order_id: orderNo })
                .eq('id', currentUser.id);
            if (error) throw error;
            currentUserProfile = { ...currentUserProfile, is_member: true, order_id: orderNo };
            window.showToast('会员开通成功！五大站点已全线解锁', 'success');
            close();
            updateUIForLoggedInUser();
        } catch (err) {
            window.showToast('验证失败：' + err.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = '提交';
        }
    });
}

function openChangePasswordModal() {
    document.getElementById('changePwdModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'changePwdModal';
    modal.className = 'fixed inset-0 z-[70]';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" id="pwdBackdrop"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div class="glass-effect rounded-2xl w-full max-w-md p-6 pointer-events-auto relative border border-white/15">
                <button id="closePwdModal" class="absolute top-4 right-4 text-gray-400 hover:text-white"><i class="fa fa-times"></i></button>
                <h2 class="text-xl font-bold text-center mb-4">修改密码</h2>
                <form id="changePwdForm" class="space-y-3">
                    <input type="password" id="newPwd" placeholder="新密码（至少6位）" class="w-full p-3 rounded-xl bg-dark/60 border border-gray-700 text-sm outline-none focus:border-neon-blue">
                    <input type="password" id="confirmPwd" placeholder="确认新密码" class="w-full p-3 rounded-xl bg-dark/60 border border-gray-700 text-sm outline-none focus:border-neon-blue">
                    <button type="submit" class="w-full py-3 rounded-xl bg-primary hover:bg-indigo-500 font-bold text-sm">确认修改</button>
                </form>
            </div>
        </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    document.getElementById('closePwdModal')?.addEventListener('click', close);
    document.getElementById('pwdBackdrop')?.addEventListener('click', close);
    document.getElementById('changePwdForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('newPwd').value;
        const cpwd = document.getElementById('confirmPwd').value;
        if (pwd.length < 6) { window.showToast('密码至少6位', 'error'); return; }
        if (pwd !== cpwd) { window.showToast('两次密码不一致', 'error'); return; }
        try {
            const { error } = await supabaseClient.auth.updateUser({ password: pwd });
            if (error) throw error;
            window.showToast('密码修改成功', 'success');
            close();
        } catch (err) {
            window.showToast('修改失败：' + err.message, 'error');
        }
    });
}

function updateUIForLoggedInUser() {
    const authSection = document.getElementById('auth-section');
    if (!authSection || !currentUser) return;
    const name = (currentUser.email || '用户').split('@')[0];
    const isMember = currentUserProfile?.is_member === true;
    authSection.innerHTML = `
        <div class="relative group">
            <button class="flex items-center gap-2 bg-dark-light border border-white/15 rounded-full pl-2 pr-4 py-1.5">
                <div class="w-7 h-7 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-xs font-bold">${name.charAt(0).toUpperCase()}</div>
                <span class="text-white text-sm">${name}</span>
                ${isMember ? '<i class="fa fa-crown text-yellow-400"></i>' : ''}
                <i class="fa fa-chevron-down text-gray-400 text-xs"></i>
            </button>
            <div class="absolute right-0 mt-2 w-44 rounded-xl glass-effect border border-white/15 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div class="py-1.5">
                    <button id="changePwdBtn" class="w-full text-left px-4 py-2 text-sm hover:bg-white/5"><i class="fa fa-key mr-2"></i>修改密码</button>
                    ${!isMember ? '<button id="vipOpenBtn" class="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10"><i class="fa fa-crown mr-2"></i>开通会员</button>' : ''}
                    <div class="border-t border-white/10 my-1"></div>
                    <button id="logoutBtn" class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"><i class="fa fa-sign-out mr-2"></i>退出登录</button>
                </div>
            </div>
        </div>`;
    document.getElementById('changePwdBtn')?.addEventListener('click', openChangePasswordModal);
    document.getElementById('vipOpenBtn')?.addEventListener('click', openVIPModal);
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if (supabaseClient) await supabaseClient.auth.signOut();
        currentUser = null;
        currentUserProfile = null;
        updateUIForLoggedOutUser();
        window.showToast('已退出登录', 'info');
    });
}

function updateUIForLoggedOutUser() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;
    authSection.innerHTML = `
        <button id="login-btn" class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-all flex items-center gap-2 btn-shine shadow-lg shadow-indigo-500/25">
            <i class="fa fa-user-circle"></i><span>登录 / 注册</span>
        </button>`;
    document.getElementById('login-btn')?.addEventListener('click', openAuthModal);
}

async function fetchUserProfile() {
    if (!currentUser || !supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('GameTogether').select('*').eq('id', currentUser.id).single();
        currentUserProfile = (!error && data) ? data : { is_member: false };
    } catch {
        currentUserProfile = { is_member: false };
    }
}

async function checkAuthStatus() {
    if (!supabaseClient) { updateUIForLoggedOutUser(); return; }
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) {
        currentUser = null;
        currentUserProfile = null;
        updateUIForLoggedOutUser();
        return;
    }
    currentUser = session.user;
    await fetchUserProfile();
    updateUIForLoggedInUser();
}

async function handleLogin(e) {
    e.preventDefault();
    if (!supabaseClient) { window.showToast('系统离线', 'error'); return; }
    const btn = document.getElementById('login-submit');
    const loader = document.getElementById('login-loading');
    const form = document.getElementById('login-form-element');
    setButtonLoading(btn, loader, true, '登录');
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: document.getElementById('login-email').value.trim(),
            password: document.getElementById('login-password').value
        });
        if (error) throw error;
        currentUser = data.user;
        await fetchUserProfile();
        window.showToast('登录成功', 'success');
        updateUIForLoggedInUser();
        closeAuthModal();
    } catch (err) {
        let msg = err.message || '登录失败';
        if (msg.includes('Invalid login credentials')) msg = '邮箱或密码错误';
        else if (msg.includes('Email not confirmed')) msg = '请先验证邮箱后再登录';
        window.showToast(msg, 'error');
        shakeForm(form);
    } finally {
        setButtonLoading(btn, loader, false, '登录');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    if (!supabaseClient) { window.showToast('系统离线', 'error'); return; }
    const form = document.getElementById('register-form-element');
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const pwd = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm-password').value;
    if (pwd.length < 6) { window.showToast('密码至少需要6位', 'error'); shakeForm(form); return; }
    if (pwd !== confirm) { window.showToast('两次密码不一致', 'error'); shakeForm(form); return; }

    const btn = document.getElementById('register-submit');
    const loader = document.getElementById('register-loading');
    setButtonLoading(btn, loader, true, '立即注册');
    try {
        const { error } = await supabaseClient.auth.signUp({ email, password: pwd });
        if (error) {
            let msg = error.message;
            if (msg.includes('already registered')) { msg = '该邮箱已注册，请直接登录'; switchToLogin(); }
            else if (msg.includes('rate limit')) msg = '操作过于频繁，请稍后再试';
            window.showToast(msg, 'error');
            shakeForm(form);
            return;
        }
        window.showToast('注册成功！请查收验证邮件并登录', 'success');
        form.reset();
        switchToLogin();
    } catch {
        window.showToast('注册失败，请稍后重试', 'error');
        shakeForm(form);
    } finally {
        setButtonLoading(btn, loader, false, '立即注册');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-btn')?.addEventListener('click', openAuthModal);
    document.getElementById('close-auth-modal')?.addEventListener('click', closeAuthModal);
    document.getElementById('auth-backdrop')?.addEventListener('click', closeAuthModal);
    document.getElementById('tab-login')?.addEventListener('click', switchToLogin);
    document.getElementById('tab-register')?.addEventListener('click', switchToRegister);
    document.getElementById('login-form-element')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form-element')?.addEventListener('submit', handleRegister);
    document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeAuthModal();
        openForgotPasswordModal();
    });
    switchToLogin();
    checkAuthStatus();
});
