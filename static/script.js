document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM الرئيسية
    const mainPage = document.getElementById('main-page');
    const preferencesPage = document.getElementById('preferences-page');
    const resultsPage = document.getElementById('results-page');
    const startBtn = document.getElementById('start-btn');
    const backToMainBtn = document.getElementById('back-to-main');
    const backToPreferencesBtn = document.getElementById('back-to-preferences');
    const preferencesForm = document.getElementById('fashion-preferences');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingStatus = document.getElementById('loading-status');
    const generateMoreBtn = document.getElementById('generate-more-outfits');
    const downloadVideoBtn = document.getElementById('download-video');
    const shareResultsBtn = document.getElementById('share-results');
    const userImageInput = document.getElementById('user-image');
    const imagePreview = document.getElementById('image-preview');

    // متغيرات التطبيق
    let currentPreferences = {};
    let generatedOutfits = [];
    let generatedVideoUrl = '';

    // معالجات الأحداث
    startBtn.addEventListener('click', showPreferencesPage);
    backToMainBtn.addEventListener('click', showMainPage);
    backToPreferencesBtn.addEventListener('click', showPreferencesPage);
    preferencesForm.addEventListener('submit', handleFormSubmit);
    generateMoreBtn.addEventListener('click', generateMoreOutfits);
    downloadVideoBtn.addEventListener('click', downloadVideo);
    shareResultsBtn.addEventListener('click', shareResults);
    userImageInput.addEventListener('change', handleImageUpload);

    // وظائف التنقل بين الصفحات
    function showMainPage() {
        mainPage.style.display = 'block';
        preferencesPage.style.display = 'none';
        resultsPage.style.display = 'none';
    }

    function showPreferencesPage() {
        mainPage.style.display = 'none';
        preferencesPage.style.display = 'block';
        resultsPage.style.display = 'none';
    }

    function showResultsPage() {
        mainPage.style.display = 'none';
        preferencesPage.style.display = 'none';
        resultsPage.style.display = 'block';
    }

    // معالجة رفع الصورة
    async function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            showLoading();
            loadingStatus.textContent = 'جاري تحميل وتحليل الصورة';
            
            try {
                const formData = new FormData();
                formData.append('image', file);
                
                console.log('جاري رفع الصورة إلى الخادم...');
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                console.log('استجابة رفع الصورة:', data);
                
                if (!response.ok) {
                    throw new Error(data.error || 'فشل في رفع الصورة');
                }
                
                if (data.success) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imagePreview.innerHTML = `<img src="${e.target.result}" alt="الصورة المرفوعة">`;
                        imagePreview.style.display = 'block';
                        currentPreferences.userImage = e.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    throw new Error(data.error || 'فشل في معالجة الصورة');
                }
            } catch (error) {
                console.error('تفاصيل خطأ رفع الصورة:', {
                    error: error,
                    message: error.message,
                    stack: error.stack
                });
                
                alert(`حدث خطأ أثناء رفع الصورة: ${error.message}`);
            } finally {
                hideLoading();
            }
        }
    }

    // معالجة إرسال النموذج
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        // جمع البيانات من النموذج
        currentPreferences = {
            gender: document.getElementById('gender').value,
            ageGroup: document.getElementById('age-group').value,
            styles: Array.from(document.querySelectorAll('input[name="style"]:checked')).map(el => el.value),
            colors: [
                document.getElementById('color1').value,
                document.getElementById('color2').value,
                document.getElementById('color3').value
            ],
            userImage: currentPreferences.userImage || null
        };

        console.log('بيانات التفضيلات المرسلة:', currentPreferences);
        
        // عرض شاشة التحميل
        showLoading();
        
        try {
            // المرحلة 1: توليد النص
            loadingStatus.textContent = 'المرحلة 1/3: جاري تحليل تفضيلاتك وإنشاء النصائح';
            const fashionAdvice = await generateFashionAdvice(currentPreferences);
            
            // المرحلة 2: توليد الصور
            loadingStatus.textContent = 'المرحلة 2/3: جاري إنشاء تصاميم الأزياء';
            const outfits = await generateFashionImages(currentPreferences);
            generatedOutfits = outfits;
            
            // المرحلة 3: توليد الفيديو
            loadingStatus.textContent = 'المرحلة 3/3: جاري إنشاء عرض الأزياء الافتراضي';
            const videoUrl = await generateFashionVideo(currentPreferences);
            generatedVideoUrl = videoUrl;
            
            // عرض النتائج
            displayResults(fashionAdvice, outfits, videoUrl);
            showResultsPage();
        } catch (error) {
            console.error('تفاصيل الخطأ الكامل:', {
                error: error,
                message: error.message,
                stack: error.stack,
                response: error.response
            });
            
            alert(`حدث خطأ أثناء إنشاء التوصيات. التفاصيل:\n${error.message}\n\nراجع وحدة تحكم المطور لمزيد من المعلومات.`);
        } finally {
            hideLoading();
        }
    }

    // عرض النتائج
    function displayResults(advice, outfits, videoUrl) {
        // عرض النص
        document.getElementById('ai-text-advice').textContent = advice;
        
        // عرض الصور
        const outfitsContainer = document.getElementById('outfits-container');
        outfitsContainer.innerHTML = '';
        
        outfits.forEach((outfit, index) => {
            const outfitCard = document.createElement('div');
            outfitCard.className = 'outfit-card';
            outfitCard.innerHTML = `<img src="${outfit}" alt="زي ${index + 1}">`;
            outfitsContainer.appendChild(outfitCard);
        });
        
        // عرض الفيديو
        const videoElement = document.getElementById('ai-generated-video');
        if (videoUrl) {
            videoElement.src = videoUrl;
            videoElement.style.display = 'block';
        } else {
            videoElement.style.display = 'none';
        }
    }

    // توليد المزيد من التصاميم
    async function generateMoreOutfits() {
        showLoading();
        loadingStatus.textContent = 'جاري إنشاء المزيد من التصاميم';
        
        try {
            const newOutfits = await generateFashionImages(currentPreferences);
            generatedOutfits = [...generatedOutfits, ...newOutfits];
            
            // عرض النتائج المحدثة
            displayResults(
                document.getElementById('ai-text-advice').textContent,
                generatedOutfits,
                generatedVideoUrl
            );
        } catch (error) {
            console.error('تفاصيل خطأ التصاميم الإضافية:', error);
            alert(`حدث خطأ أثناء إنشاء التصاميم الإضافية: ${error.message}`);
        } finally {
            hideLoading();
        }
    }

    // تحميل الفيديو
    function downloadVideo() {
        if (!generatedVideoUrl) {
            alert('لا يوجد فيديو متاح للتحميل');
            return;
        }
        
        const a = document.createElement('a');
        a.href = generatedVideoUrl;
        a.download = 'عرض-الازياء-الافتراضي.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // مشاركة النتائج
    function shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'توصيات الموضة المخصصة لي',
                text: 'اكتشف توصيات الموضة المخصصة التي أنشأها الذكاء الاصطناعي!',
                url: window.location.href
            }).catch(err => {
                console.error('حدث خطأ أثناء المشاركة:', err);
                alert('يمكنك نسخ الرابط ومشاركته يدوياً.');
            });
        } else {
            alert('يمكنك نسخ الرابط ومشاركته يدوياً.');
        }
    }

    // وظائف التحكم بشاشة التحميل
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // دوال الاتصال بالخادم
    // const API_BASE_URL = 'http://localhost:5000'; // أو عنوان خادمك
    const API_BASE_URL = window.location.origin; 
    async function generateFashionAdvice(preferences) {
        try {
            console.log('جاري إرسال طلب النصائح إلى الخادم...');
            const response = await fetch(`${API_BASE_URL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    preferences: preferences,
                    generate_video: false
                })
            });
            
            const data = await response.json();
            console.log('استجابة النصائح من الخادم:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'فشل في توليد النصائح');
            }
            
            if (data.success) {
                return data.advice;
            } else {
                throw new Error(data.error || 'فشل في توليد النصائح');
            }
        } catch (error) {
            console.error('خطأ في توليد نصائح الموضة:', error);
            throw error;
        }
    }

    async function generateFashionImages(preferences) {
        try {
            console.log('جاري إرسال طلب الصور إلى الخادم...');
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    preferences: preferences,
                    generate_video: false
                })
            });
            
            const data = await response.json();
            console.log('استجابة الصور من الخادم:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'فشل في توليد الصور');
            }
            
            if (data.success) {
                return data.outfits || [];
            } else {
                throw new Error(data.error || 'فشل في توليد الصور');
            }
        } catch (error) {
            console.error('خطأ في توليد صور الموضة:', error);
            throw error;
        }
    }

    async function generateFashionVideo(preferences) {
        try {
            console.log('جاري إرسال طلب الفيديو إلى الخادم...');
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    preferences: preferences,
                    generate_video: true
                })
            });
            
            const data = await response.json();
            console.log('استجابة الفيديو من الخادم:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'فشل في توليد الفيديو');
            }
            
            if (data.success) {
                return data.video || '';
            } else {
                throw new Error(data.error || 'فشل في توليد الفيديو');
            }
        } catch (error) {
            console.error('خطأ في توليد فيديو الموضة:', error);
            throw error;
        }
    }

    // تهيئة التطبيق
    showMainPage();
});