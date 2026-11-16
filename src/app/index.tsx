import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';

// Import expo-notifications secara aman khusus untuk mobile
let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.log("Notifications not supported");
  }
}

// Import AsyncStorage secara aman untuk penyimpanan HP
let AsyncStorage: any = null;
if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    console.log("AsyncStorage not supported");
  }
}

// Fungsi bantuan untuk mendapatkan ID unik minggu berjalan (tanggal hari Senin pada minggu ini)
const getMondayWeekId = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Geser ke hari Senin
  d.setDate(diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
};

const workoutDataByLevel = {
  Pemula: {
    Senin: {
      title: "Upper Body & Postur Skapular (Pemula)",
      exercises: [
        { name: "Wall Slides (Geser Tangan di Dinding)", sets: "3 Set", reps: "10-12 Repetisi", guide: "Berdiri membelakangi tembok. Tempelkan seluruh punggung, kepala, dan siku ke tembok (posisi tangan menyerupai huruf W). Geser tangan perlahan ke atas dan ke bawah seperti mengusap dinding untuk mengatasi punggung bungkuk / skapular menonjol." },
        { name: "Knee Serratus Push-Up (Push-Up Lutut)", sets: "3 Set", reps: "8-10 Repetisi", guide: "Ambil posisi push-up, tapi tumpuan ada di lutut (bukan ujung kaki). Saat tangan mendorong badan ke atas, dorong ekstra punggung bagian atas ke atas setinggi mungkin (seperti punggung kucing meregang) untuk mengunci otot belikat." },
        { name: "Incline Push-Up (Push-Up di Tepi Kasur)", sets: "3 Set", reps: "10 Repetisi", guide: "Letakkan kedua tangan di tepi kasur atau meja yang kokoh. Turunkan dada perlahan mendekati tepi meja, lalu dorong kembali ke atas untuk melatih kekuatan dasar dada dan bahu." }
      ]
    },
    Selasa: {
      title: "Kaki & Koreksi Bentuk O (Pemula)",
      exercises: [
        { name: "Clamshells (Buka Tutup Lutut Miring)", sets: "3 Set", reps: "12 Repetisi (Masing-masing kaki)", guide: "Berbaring miring di lantai. Tekuk kedua lutut sekitar 90 derajat. Tanpa memutar pinggul, buka lutut bagian atas ke atas (seperti cangkang kerang terbuka) untuk memperkuat pinggul luar agar posisi lutut lebih lurus." },
        { name: "Side Leg Raises (Angkat Kaki Samping)", sets: "3 Set", reps: "12 Repetisi (Masing-masing kaki)", guide: "Berbaring miring di lantai. Angkat kaki bagian atas lurus ke atas secara perlahan, lalu turunkan kembali secara terkontrol tanpa menyentuh lantai sepenuhnya." },
        { name: "Half Bodyweight Squat (Squat Dangkal)", sets: "3 Set", reps: "10 Repetisi", guide: "Berdiri buka kaki selebar bahu. Tekuk lutut setengah jalan ke bawah (seperti ingin duduk tapi tidak penuh), jaga punggung tetap lurus dan lutut sejajar arah jari kaki." }
      ]
    },
    Rabu: {
      title: "Core & Stabilitas Punggung",
      exercises: [
        { name: "Plank (Tahan Badan di Lantai)", sets: "3 Set", reps: "Tahan 30 Detik", guide: "Tahan posisi tubuh lurus sejajar lantai dengan bertumpu pada lengan bawah dan ujung jari kaki. Kencangkan perut dan jangan biarkan pinggul turun ke bawah." },
        { name: "Bird-Dog (Merangkak Angkat Tangan-Kaki)", sets: "3 Set", reps: "10 Repetisi (Bergantian)", guide: "Posisi merangkak di lantai. Luruskan tangan kanan ke depan dan kaki kiri ke belakang secara bersamaan hingga lurus sejajar punggung, lalu bergantian sisi." }
      ]
    },
    Kamis: {
      title: "Peregangan & Mobilitas Kaki",
      exercises: [
        { name: "Hamstring Stretch (Regang Paha Belakang)", sets: "2 Set", reps: "Tahan 30 Detik per Sisi", guide: "Duduk di lantai dengan satu kaki diluruskan ke depan. Condongkan badan ke depan perlahan hingga terasa tarikan di bagian belakang paha." },
        { name: "Ankle Mobility (Regang Pergelangan Kaki)", sets: "2 Set", reps: "10 Repetisi per Kaki", guide: "Berdiri menghadap dinding, letakkan ujung kaki dekat dinding lalu tekuk lutut menyentuh dinding untuk melenturkan pergelangan kaki." }
      ]
    },
    Jumat: {
      title: "Full Body Posture Light",
      exercises: [
        { name: "Prone Y-Raises (Angkat Tangan Huruf Y)", sets: "3 Set", reps: "10 Repetisi", guide: "Berbaring tengkurap di lantai. Angkat dada dan tangan sedikit dari lantai sambil membentuk huruf 'Y' dengan tangan, rasakan otot punggung atas bekerja." },
        { name: "Wall Sit (Duduk Bersandar Tembok)", sets: "3 Set", reps: "Tahan 30 Detik", guide: "Bersandar di dinding seperti posisi duduk di kursi (tanpa kursi di bawah), tahan posisi paha sejajar lantai untuk menguatkan lutut." }
      ]
    },
    Sabtu: {
      title: "Rest Day (Istirahat Total)",
      exercises: [
        { name: "Pemulihan Otot", sets: "1 Sesi", reps: "Sepanjang Hari", guide: "Waktunya rest day, dilarang workout!! Minum air putih yang cukup dan biarkan otot memperbaiki diri." }
      ]
    },
    Minggu: {
      title: "Rest Day (Hari Santai)",
      exercises: [
        { name: "Relaksasi & Persiapan", sets: "1 Sesi", reps: "Sepanjang Hari", guide: "Waktunya rest day, dilarang workout!! Nikmati hari libur untuk relaksasi total." }
      ]
    }
  },
  Menengah: {
    Senin: {
      title: "V-Taper & Skapular Strength (Menengah)",
      exercises: [
        { name: "Towel Door Row (Tarik Handuk di Pintu)", sets: "4 Set", reps: "10-12 Repetisi", guide: "Kaitkan handuk panjang di pegangan pintu yang kokoh. Pegang kedua ujungnya, majukan kaki ke depan, lalu tarik dada mendekat ke arah pintu untuk melatih otot sayap (V-taper) tanpa alat gym." },
        { name: "Pike Push-Up (Push-Up V Terbalik)", sets: "3 Set", reps: "8-10 Repetisi", guide: "Letakkan kaki di atas kursi/kasur dan tangan di lantai. Angkat pinggul tinggi membentuk huruf V terbalik, lalu turunkan kepala ke lantai untuk membentuk bahu bidang." },
        { name: "Floor Scapular Retractions (Jepit Belikat)", sets: "3 Set", reps: "12 Repetisi", guide: "Tengkurap di lantai dengan tangan rileks di samping. Fokuskan menjepit kedua tulang belikat di punggung atas ke tengah (seperti menjepit pensil), tahan 3 detik lalu lepas." }
      ]
    },
    Selasa: {
      title: "Lower Body & Alignment Kaki O (Menengah)",
      exercises: [
        { name: "Sumo Bodyweight Squat (Squat Lebar)", sets: "4 Set", reps: "12 Repetisi", guide: "Berdiri dengan kaki dibuka lebih lebar dari bahu dan ujung kaki menghadap keluar (posisi pesumo). Turunkan pinggul sambil memastikan lutut menekan ke arah luar sejajar jari kaki." },
        { name: "Side Lunges (Langkah Samping)", sets: "3 Set", reps: "10 Repetisi per Sisi", guide: "Langkahkan kaki ke samping secara bergantian, tekuk lutut satu sisi sementara kaki lainnya lurus untuk melatih keseimbangan dan sisi paha." },
        { name: "Glute Bridges (Angkat Pinggul Telentang)", sets: "3 Set", reps: "15 Repetisi", guide: "Berbaring telentang di lantai, tekuk lutut. Dorong pinggul ke atas hingga badan lurus dari lutut ke bahu, kencangkan otot bokong di puncak gerakan." }
      ]
    },
    Rabu: {
      title: "Back & Posture Correction",
      exercises: [
        { name: "Prone Cobra Holds (Tahan Posisi Kobra)", sets: "3 Set", reps: "Tahan 30 Detik", guide: "Tengkurap di lantai, angkat dada dan tangan lurus ke atas sambil memutar telapak tangan menghadap luar untuk mengunci posisi skapular." },
        { name: "Sturdy Table Inverted Row (Tarik Kolong Meja)", sets: "4 Set", reps: "8-10 Repetisi", guide: "Berbaring di bawah meja belajar yang kokoh. Pegang tepi meja dengan kedua tangan, lalu tarik dada ke atas menyentuh kolong meja untuk ketebalan punggung." }
      ]
    },
    Kamis: {
      title: "Core & V-Taper Stability",
      exercises: [
        { name: "Side Plank with Leg Raise (Plank Samping Angkat Kaki)", sets: "3 Set", reps: "Tahan 30 Detik per Sisi", guide: "Plank bertumpu pada satu lengan ke samping, lalu angkat kaki atas lurus ke udara untuk melatih pinggang ramping dan stabilitas panggul." },
        { name: "Hollow Body Hold (Badan Cekung Perahu)", sets: "3 Set", reps: "Tahan 20-30 Detik", guide: "Berbaring telentang, angkat sedikit bahu, kepala, dan kedua kaki lurus dari lantai membentuk kurva cekung seperti perahu. Perut terasa sangat ketat." }
      ]
    },
    Jumat: {
      title: "Calisthenics Full Body",
      exercises: [
        { name: "Regular Push-Up (Push-Up Standar)", sets: "4 Set", reps: "12 Repetisi", guide: "Push-up standar di lantai dengan posisi tangan selebar bahu dan siku membentuk sudut 45 derajat dari badan saat turun." },
        { name: "Chair Dips (Turun Naik Kursi)", sets: "3 Set", reps: "10-12 Repetisi", guide: "Duduk di tepi kursi stabil, letakkan tangan di samping pinggul. Majukan pantat melayang ke depan, lalu tekuk siku untuk menurunkan badan guna melatih dada bawah & tricep." },
        { name: "Mountain Climbers (Lari di Tempat Posisi Push-Up)", sets: "3 Set", reps: "40 Detik", guide: "Ambil posisi push-up, lalu tarik lutut ke dada secara bergantian dengan tempo cepat secara konstan untuk membakar kalori dan kardio." }
      ]
    },
    Sabtu: {
      title: "Rest Day (Istirahat & Pemulihan)",
      exercises: [
        { name: "Active Recovery", sets: "1 Sesi", reps: "Sepanjang Hari", guide: "Waktunya rest day, dilarang workout!! Jalan santai ringan saja jika ingin bergerak." }
      ]
    },
    Minggu: {
      title: "Rest Day (Hari Santai)",
      exercises: [
        { name: "Relaksasi Total", sets: "1 Sesi", reps: "Sepanjang Hari", guide: "Waktunya rest day, dilarang workout!! Istirahat penuh dan nikmati liburanmu." }
      ]
    }
  },
  Ahli: {
    Senin: {
      title: "Advanced V-Taper & Lats Master (Ahli)",
      exercises: [
        { name: "Doorframe Single-Arm Rows (Tarik Kusen Satu Tangan)", sets: "4 Set", reps: "10 Repetisi per Tangan", guide: "Berdiri di kusen pintu yang kokoh, pegang sisi kusen dengan satu tangan, miringkan badan ke belakang lalu tarik badan untuk kontraksi maksimal otot lats (V-taper)." },
        { name: "Pike Push-Up Kaki Tinggi (Di atas Kursi)", sets: "4 Set", reps: "10 Repetisi", guide: "Pike push-up tingkat lanjut dengan meletakkan kedua kaki di atas kursi atau kasur tinggi agar beban bertumpu lebih berat di bahu." },
        { name: "Floor Scapular Hovers (Kontrol Belikat di Lantai)", sets: "3 Set", reps: "12 Repetisi", guide: "Mengontrol pergerakan belikat secara penuh saat tengkurap di lantai tanpa menyentuh lantai sepenuhnya." }
      ]
    },
    Selasa: {
      title: "Deep Leg Alignment & O-Leg Correction (Ahli)",
      exercises: [
        { name: "Cossack Squat (Squat Samping Dalam)", sets: "4 Set", reps: "8 Repetisi per Sisi", guide: "Squat mendalam ke satu sisi sementara kaki lainnya lurus terbuka di lantai. Sangat bagus untuk mobilitas panggul dalam dan koreksi kaki O." },
        { name: "Pistol Squat Dibantu Kusen Pintu", sets: "3 Set", reps: "6-8 Repetisi per Sisi", guide: "Squat menggunakan satu kaki penuh sementara kaki lain diluruskan ke depan, gunakan tangan memegang kusen pintu sebagai penyeimbang." },
        { name: "Single-Leg Romanian Deadlift (Keseimbangan Satu Kaki)", sets: "3 Set", reps: "10 Repetisi per Sisi", guide: "Berdiri dengan satu kaki, bungkukkan badan ke depan sambil meluruskan kaki belakang ke belakang untuk melatih kekuatan dan keseimbangan kaki." }
      ]
    },
    Rabu: {
      title: "Advanced Scapular & Posterior Chain",
      exercises: [
        { name: "Y-T-W Floor Raises (Angkat Tangan Kombinasi)", sets: "4 Set", reps: "8 Repetisi per Posisi", guide: "Tengkurap di lantai, gerakkan tangan membentuk huruf Y, lalu T, lalu W secara berurutan dengan kontrol otot punggung atas yang ketat." },
        { name: "Archer Push-Up (Push-Up Pemanah)", sets: "4 Set", reps: "8 Repetisi per Sisi", guide: "Push-up dengan melebarkan tangan, saat turun beban badan digeser sepenuhnya ke satu sisi tangan sementara tangan satunya lurus ke samping." }
      ]
    },
    Kamis: {
      title: "Advanced Core & V-Taper Obliques",
      exercises: [
        { name: "Floor L-Sit Hold (Angkat Badan Duduk Lantai)", sets: "4 Set", reps: "Tahan 15-20 Detik", guide: "Duduk di lantai, letakkan kedua telapak tangan di samping pinggul lalu dorong badan ke atas hingga bokong dan kaki terangkat lurus dari lantai." },
        { name: "Floor Wiper Legs (Ayun Kaki Kiri-Kanan)", sets: "3 Set", reps: "12 Repetisi", guide: "Berbaring telentang di lantai dengan kaki rapat terangkat. Ayunkan kedua kaki rapat ke sisi kiri dan kanan secara perlahan tanpa menyentuh lantai." }
      ]
    },
    Jumat: {
      title: "Extreme Home Calisthenics",
      exercises: [
        { name: "Decline Push-Up (Kaki di Atas Kursi)", sets: "4 Set", reps: "12 Repetisi", guide: "Push-up dengan posisi kaki bertumpu di atas kursi dan tangan di lantai untuk memberi tekanan maksimal pada dada atas dan bahu depan." },
        { name: "Deep Chair Dips (Dips Kursi Rentang Penuh)", sets: "4 Set", reps: "12 Repetisi", guide: "Dips menggunakan dua kursi sejajar dengan rentang gerak turun yang lebih dalam untuk kontraksi otot maksimal." },
        { name: "Burpees (Lompat & Push-Up)", sets: "3 Set", reps: "10-12 Repetisi", guide: "Gerakan berdiri, turun ke posisi push-up di lantai, lakukan sekali push-up, lompat bangkit berdiri lalu loncat ke atas dengan tangan di udara." }
      ]
    },
    Sabtu: {
      title: "Rest Day (Mobilitas Aktif)",
      exercises: [
        { name: "Stretching Ringan", sets: "1 Sesi", reps: "20 Menit", guide: "Waktunya rest day, dilarang workout!! Lakukan peregangan otot santai saja." }
      ]
    },
    Minggu: {
      title: "Rest Day (Istirahat Total)",
      exercises: [
        { name: "Pemulihan Penuh", sets: "1 Sesi", reps: "Sepanjang Hari", guide: "Waktunya rest day, dilarang workout!! Istirahat total." }
      ]
    }
  }
};

const STORAGE_KEY = 'jadwal_workout_data_v17';

export default function HomeScreen() {
  const [selectedLevel, setSelectedLevel] = useState<'Pemula' | 'Menengah' | 'Ahli'>('Menengah');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<{ name: string; sets: string; reps: string; guide: string } | null>(null);
  
  const [isNotifActive, setIsNotifActive] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>("07:00");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastNotifiedDate, setLastNotifiedDate] = useState<string>('');

  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [monthlyCount, setMonthlyCount] = useState<number>(0);
  const [yearlyCount, setYearlyCount] = useState<number>(0);
  
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'year'>('week');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const now = new Date();
  const currentWeekId = getMondayWeekId(now);
  const currentMonthName = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][now.getMonth()];
  const currentYearName = now.getFullYear().toString();

  const workoutData = workoutDataByLevel[selectedLevel];
  const dayKeys = Object.keys(workoutData);

  // Load data tersimpan saat aplikasi dibuka + Cek Auto-Reset Mingguan, Bulanan, Tahunan
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        let savedDataStr = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          savedDataStr = window.localStorage.getItem(STORAGE_KEY);
        } else if (AsyncStorage) {
          savedDataStr = await AsyncStorage.getItem(STORAGE_KEY);
        }

        if (savedDataStr) {
          const parsed = JSON.parse(savedDataStr);
          if (parsed.reminderTime) setReminderTime(parsed.reminderTime);
          if (typeof parsed.isNotifActive === 'boolean') setIsNotifActive(parsed.isNotifActive);
          if (parsed.selectedLevel) setSelectedLevel(parsed.selectedLevel);

          // 1. Cek pergantian minggu (reset otomatis setiap hari Senin baru)
          if (parsed.savedWeekId && parsed.savedWeekId !== currentWeekId) {
            setCompletedDays({});
            showToast("📅 Minggu baru (Senin) dimulai! Jadwal mingguan di-reset, progres bulanan & tahunan tetap tersimpan.");
          } else if (parsed.completedDays) {
            setCompletedDays(parsed.completedDays);
          }

          // 2. Cek pergantian bulan
          if (parsed.savedMonth && parsed.savedMonth !== currentMonthName) {
            setMonthlyCount(0);
            showToast(`📅 Memasuki bulan baru (${currentMonthName}), progres bulanan di-reset otomatis!`);
          } else if (typeof parsed.monthlyCount === 'number') {
            setMonthlyCount(parsed.monthlyCount);
          }

          // 3. Cek pergantian tahun
          if (parsed.savedYear && parsed.savedYear !== currentYearName) {
            setYearlyCount(0);
            showToast(`🏆 Memasuki tahun baru (${currentYearName}), progres tahunan di-reset otomatis!`);
          } else if (typeof parsed.yearlyCount === 'number') {
            setYearlyCount(parsed.yearlyCount);
          }
        }
      } catch (e) {
        console.error("Gagal memuat data lokal:", e);
      }
      setIsLoaded(true);
    };

    loadSavedData();
  }, []);

  // Timer pengecekan web notification real-time khusus platform web
  useEffect(() => {
    if (!isNotifActive || Platform.OS !== 'web') return;

    const interval = setInterval(() => {
      const currentTime = new Date();
      const dayIndex = currentTime.getDay(); 
      const hours = String(currentTime.getHours()).padStart(2, '0');
      const minutes = String(currentTime.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      const todayDateStr = currentTime.toDateString();

      const isRestDay = (dayIndex === 0 || dayIndex === 6);
      const targetTime = isRestDay ? "05:00" : reminderTime;
      const notifTitle = isRestDay ? "🛑 Hari Istirahat (Rest Day)" : "🔥 Waktunya Home Workout!";
      const notifBody = isRestDay ? "Waktunya rest day, dilarang workout!! Nikmati istirahatmu." : `Sudah pukul ${reminderTime} WIB. Yuk semangat capai target V-Taper hari ini!`;

      if (currentTimeStr === targetTime && lastNotifiedDate !== todayDateStr) {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notifTitle, { body: notifBody });
        }
        setLastNotifiedDate(todayDateStr);
        showToast(`🔔 Notifikasi: ${notifTitle}`);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isNotifActive, reminderTime, lastNotifiedDate]);

  // Simpan data otomatis setiap ada perubahan (Support Web & HP Android)
  useEffect(() => {
    if (!isLoaded) return;
    
    const saveData = async () => {
      try {
        const dataToSave = {
          completedDays,
          monthlyCount,
          yearlyCount,
          reminderTime,
          isNotifActive,
          selectedLevel,
          savedWeekId: currentWeekId,
          savedMonth: currentMonthName,
          savedYear: currentYearName
        };
        const jsonString = JSON.stringify(dataToSave);

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, jsonString);
        } else if (AsyncStorage) {
          await AsyncStorage.setItem(STORAGE_KEY, jsonString);
        }
      } catch (e) {
        console.error("Gagal menyimpan data lokal:", e);
      }
    };

    saveData();
  }, [completedDays, monthlyCount, yearlyCount, reminderTime, isNotifActive, selectedLevel, isLoaded, currentWeekId, currentMonthName, currentYearName]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleToggleNotification = async () => {
    const nextStatus = !isNotifActive;
    
    if (nextStatus) {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            showToast("⚠️ Izin notifikasi browser ditolak.");
            return;
          }
        }
        setIsNotifActive(true);
        showToast(`🔔 Pengingat Web aktif! Workout pukul ${reminderTime} WIB, Rest Day pukul 05:00 WIB.`);
      } else {
        try {
          if (!Notifications) {
            showToast("⚠️ Modul notifikasi tidak tersedia.");
            return;
          }

          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            showToast("⚠️ Izin notifikasi ditolak oleh HP.");
            return;
          }

          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'Workout Reminder',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#3b82f6',
              sound: 'default',
            });
          }

          const parts = reminderTime.split(':');
          const workHour = parseInt(parts[0], 10);
          const workMinute = parseInt(parts[1], 10);

          if (isNaN(workHour) || isNaN(workMinute) || workHour < 0 || workHour > 23 || workMinute < 0 || workMinute > 59) {
            showToast("⚠️ Format jam salah! Gunakan format HH:MM (contoh 07:00).");
            return;
          }

          await Notifications.cancelAllScheduledNotificationsAsync();

          // Workout Senin - Jumat (Berulang otomatis setiap minggu)
          const workoutWeekdays = [2, 3, 4, 5, 6];
          for (const weekday of workoutWeekdays) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "🔥 Waktunya Home Workout!",
                body: `Sudah pukul ${reminderTime} WIB. Yuk semangat capai target V-Taper hari ini!`,
                sound: true,
              },
              trigger: {
                type: 'weekly',
                channelId: 'default',
                weekday: weekday,
                hour: workHour,
                minute: workMinute,
              },
            });
          }

          // Rest Day Sabtu & Minggu jam 05:00 (Berulang otomatis setiap minggu)
          const restWeekdays = [7, 1];
          for (const weekday of restWeekdays) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "🛑 Hari Istirahat (Rest Day)",
                body: "Waktunya rest day, dilarang workout!! Nikmati istirahatmu.",
                sound: true,
              },
              trigger: {
                type: 'weekly',
                channelId: 'default',
                weekday: weekday,
                hour: 5,
                minute: 0,
              },
            });
          }

          setIsNotifActive(true);
          showToast("🔔 Pengingat HP & Rest Day Aktif Berulang Otomatis!");
        } catch (error: any) {
          console.error("Gagal menjadwalkan notifikasi HP:", error);
          showToast(`❌ Error: ${error?.message || "Gagal menyetel pengingat"}`);
        }
      }
    } else {
      if (Platform.OS !== 'web' && Notifications) {
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (e) {}
      }
      setIsNotifActive(false);
      showToast("🔕 Semua pengingat dinonaktifkan.");
    }
  };

  const toggleCompleteDay = (day: string) => {
    const isCurrentlyCompleted = completedDays[day];
    const willBeCompleted = !isCurrentlyCompleted;

    setCompletedDays(prev => ({
      ...prev,
      [day]: willBeCompleted
    }));

    if (willBeCompleted) {
      setMonthlyCount(prev => prev + 1);
      setYearlyCount(prev => prev + 1);
      showToast("🔥 Tersimpan ke progres mingguan, bulanan & tahunan!");
    } else {
      setMonthlyCount(prev => Math.max(0, prev - 1));
      setYearlyCount(prev => Math.max(0, prev - 1));
      showToast("↩️ Catatan dibatalkan.");
    }
  };

  const handleResetProgress = () => {
    if (activeTab === 'week') {
      setCompletedDays({});
      showToast("🔄 Progres Mingguan di-reset! (Data bulanan & tahunan tetap aman)");
    } else if (activeTab === 'month') {
      setMonthlyCount(0);
      showToast("🔄 Progres Bulanan di-reset!");
    } else if (activeTab === 'year') {
      setYearlyCount(0);
      showToast("🔄 Progres Tahunan di-reset!");
    }
  };

  const weekCount = Object.values(completedDays).filter(Boolean).length;
  const weekPercent = Math.round((weekCount / dayKeys.length) * 100);

  const monthTarget = 28;
  const monthPercent = Math.min(100, Math.round((monthlyCount / monthTarget) * 100));

  const yearTarget = 365;
  const yearPercent = Math.min(100, Math.round((yearlyCount / yearTarget) * 100));

  return (
    <ScrollView style={styles.container}>
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔥 Home Workout Pro</Text>
        <Text style={styles.headerSubtitle}>Jadwal Otomatis & Notifikasi Rest Day</Text>
      </View>

      {/* Pilihan Level Workout */}
      <View style={styles.levelCard}>
        <Text style={styles.levelCardTitle}>Pilih Level Latihan:</Text>
        <View style={styles.levelRow}>
          {(['Pemula', 'Menengah', 'Ahli'] as const).map(lvl => (
            <TouchableOpacity 
              key={lvl} 
              style={[styles.levelButton, selectedLevel === lvl && styles.levelButtonActive]}
              onPress={() => {
                setSelectedLevel(lvl);
                setSelectedDay(null);
                showToast(`Level diubah ke: ${lvl}`);
              }}
            >
              <Text style={[styles.levelButtonText, selectedLevel === lvl && styles.levelButtonTextActive]}>
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Kartu Ringkasan Progres */}
      <View style={styles.progressCard}>
        <View style={styles.tabRow}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'week' && styles.tabButtonActive]}
            onPress={() => setActiveTab('week')}
          >
            <Text style={[styles.tabText, activeTab === 'week' && styles.tabTextActive]}>Mingguan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'month' && styles.tabButtonActive]}
            onPress={() => setActiveTab('month')}
          >
            <Text style={[styles.tabText, activeTab === 'month' && styles.tabTextActive]}>Bulanan ({currentMonthName})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'year' && styles.tabButtonActive]}
            onPress={() => setActiveTab('year')}
          >
            <Text style={[styles.tabText, activeTab === 'year' && styles.tabTextActive]}>Tahunan ({currentYearName})</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'week' && (
          <View>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>📊 Progres Minggu Ini ({selectedLevel})</Text>
                <Text style={styles.progressSubtitle}>{weekCount} dari {dayKeys.length} hari tuntas (Auto-reset tiap Senin)</Text>
              </View>
              <Text style={styles.progressPercent}>{weekPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${weekPercent}%` }]} />
            </View>
            <View style={styles.badgesRow}>
              {dayKeys.map(day => {
                const done = completedDays[day];
                return (
                  <View key={day} style={[styles.badgeItem, done && styles.badgeItemDone]}>
                    <Text style={[styles.badgeText, done && { color: '#fff' }]}>{day.slice(0, 3)} {done ? '✓' : ''}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === 'month' && (
          <View>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>📅 Progres Bulan {currentMonthName}</Text>
                <Text style={styles.progressSubtitle}>{monthlyCount} dari {monthTarget} sesi tercapai</Text>
              </View>
              <Text style={styles.progressPercent}>{monthPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${monthPercent}%` }]} />
            </View>
            <Text style={styles.infoSubText}>Akumulasi otomatis dari latihan mingguan (reset tiap awal bulan).</Text>
          </View>
        )}

        {activeTab === 'year' && (
          <View>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>🏆 Progres Tahun {currentYearName}</Text>
                <Text style={styles.progressSubtitle}>{yearlyCount} dari {yearTarget} sesi tercapai</Text>
              </View>
              <Text style={styles.progressPercent}>{yearPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${yearPercent}%` }]} />
            </View>
            <Text style={styles.infoSubText}>Akumulasi otomatis sepanjang tahun (reset tiap 1 Januari).</Text>
          </View>
        )}

        <View style={styles.progressFooter}>
          <Text style={styles.motivationText}>
            {activeTab === 'week' ? "Otomatis reset tiap Senin, data tetap masuk bulanan!" : "Tersimpan permanen di memori HP."}
          </Text>
          <TouchableOpacity onPress={handleResetProgress} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset {activeTab === 'week' ? 'Minggu' : activeTab === 'month' ? 'Bulan' : 'Tahun'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bagian Pengaturan Notifikasi Canggih & Rest Day */}
      <View style={styles.notifCard}>
        <View style={styles.notifInfo}>
          <Text style={styles.notifTitle}>⏰ Pengaturan Notifikasi Pintar</Text>
          
          <View style={styles.notifDetailRow}>
            <Text style={styles.notifDetailText}>🏋️‍♂️ Workout (Sen-Jum):</Text>
            <View style={styles.timeInputRowInline}>
              <TextInput 
                style={styles.timeInput}
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="07:00"
                placeholderTextColor="#666"
              />
              <Text style={styles.notifWib}>WIB</Text>
            </View>
          </View>

          <View style={styles.notifDetailRest}>
            <Text style={styles.notifRestText}>🛑 Rest Day (Sabtu & Minggu):</Text>
            <Text style={styles.notifRestTime}>05:00 WIB ("Waktunya rest day, dilarang workout!!")</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.notifButton, isNotifActive ? styles.notifButtonActive : styles.notifButtonInactive]}
          onPress={handleToggleNotification}
        >
          <Text style={styles.notifButtonText}>
            {isNotifActive ? "Matikan" : "Aktifkan"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Kartu Jadwal Latihan & Rest Day */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jadwal Mingguan ({selectedLevel})</Text>

        {Object.entries(workoutData).map(([day, data]) => {
          const isOpen = selectedDay === day;
          const isCompleted = completedDays[day];
          const isRest = day === 'Sabtu' || day === 'Minggu';

          return (
            <View key={day} style={styles.cardContainer}>
              <TouchableOpacity 
                style={[
                  styles.card, 
                  isOpen && styles.cardActive,
                  isCompleted && styles.cardCompleted,
                  isRest && !isCompleted && styles.cardRest
                ]} 
                onPress={() => setSelectedDay(isOpen ? null : day)}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.dayText}>{day}: {data.title}</Text>
                  <Text style={[styles.statusText, isCompleted && { color: '#a7f3d0' }, isRest && !isCompleted && { color: '#fbbf24' }]}>
                    {isCompleted ? "✅ Selesai Dilakukan" : (isRest ? "🛌 Hari Istirahat (Rest Day)" : (isOpen ? "Tutup Detail" : "Ketuk untuk Lihat Detail"))}
                  </Text>
                </View>
                
                <View style={styles.cardRightAction}>
                  <TouchableOpacity 
                    style={[styles.checkButton, isCompleted ? styles.checkButtonDone : styles.checkButtonUndone]}
                    onPress={() => toggleCompleteDay(day)}
                  >
                    <Text style={styles.checkButtonText}>{isCompleted ? "✔ Selesai" : "Tandai Selesai"}</Text>
                  </TouchableOpacity>
                  <Text style={styles.arrowText}>{isOpen ? "▲" : "▼"}</Text>
                </View>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.exerciseList}>
                  {data.exercises.map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.exerciseItem}
                      onPress={() => setActiveExercise(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>🔹 {item.name}</Text>
                        <Text style={styles.exerciseTarget}>{item.sets} • {item.reps}</Text>
                      </View>
                      <Text style={styles.exerciseGuideLink}>📖 Panduan</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Modal Panduan Detail Gerakan */}
      <Modal
        visible={activeExercise !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📖 Panduan Gerakan</Text>
            {activeExercise && (
              <>
                <Text style={styles.modalExerciseName}>{activeExercise.name}</Text>
                <Text style={styles.modalExerciseTarget}>🎯 Target: {activeExercise.sets} | {activeExercise.reps}</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalGuideTitle}>Cara Melakukan:</Text>
                <Text style={styles.modalGuideText}>{activeExercise.guide}</Text>
              </>
            )}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setActiveExercise(null)}
            >
              <Text style={styles.modalCloseButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bagian Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerCreated}>Dibuat oleh Rafadhil</Text>
        <Text style={styles.footerCopyright}>© 2026 Rafadhil. Hak cipta dilindungi.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  toastContainer: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  levelCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  levelCardTitle: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 10,
    fontWeight: '600',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  levelButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  levelButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  levelButtonTextActive: {
    color: '#ffffff',
  },
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 14,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#334155',
  },
  tabText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#f8fafc',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  progressSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeItemDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  badgeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  infoSubText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  motivationText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#dc2626',
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notifCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifInfo: {
    flex: 1,
    marginRight: 10,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 8,
  },
  notifDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifDetailText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginRight: 8,
  },
  timeInputRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 6,
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 13,
    width: 60,
    textAlign: 'center',
  },
  notifWib: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  notifDetailRest: {
    marginTop: 4,
  },
  notifRestText: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '600',
  },
  notifRestTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  notifButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifButtonActive: {
    backgroundColor: '#dc2626',
  },
  notifButtonInactive: {
    backgroundColor: '#10b981',
  },
  notifButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e293b',
  },
  cardCompleted: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  cardRest: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  dayText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  cardRightAction: {
    alignItems: 'flex-end',
  },
  checkButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  checkButtonUndone: {
    backgroundColor: '#334155',
  },
  checkButtonDone: {
    backgroundColor: '#059669',
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  arrowText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  exerciseList: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  exerciseName: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseTarget: {
    fontSize: 11,
    color: '#94a3b8',
  },
  exerciseGuideLink: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalExerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  modalExerciseTarget: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 12,
  },
  modalGuideTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  modalGuideText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  footerCreated: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#94a3b8',
  },
});