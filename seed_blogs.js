import db from './server/db/index.js';

const articles = [
  {
    id: 'propagate-in-water',
    title: 'How to Propagate (Almost) Anything in Water',
    excerpt: 'Water propagation is the gentlest, most forgiving way to multiply your houseplant collection without specialized tools or greenhouse conditions.',
    content: `<p class="lead">Water propagation is the gentlest, most forgiving way to multiply your houseplant collection without specialized tools or greenhouse conditions. Watching pale root tips emerge through glass is one of the quietest joys of indoor gardening.</p>

    <h2 id="giris">1. Giriþ ve Temel Prensipler</h2>
    <p>Bitki çoðaltma, doðanýn en cömert döngülerinden biridir. Su içinde köklendirme (su kültürü), toprak kaynaklý mantar ve çürüme risklerini minimize ederek kök geliþimini gözlemlemenize olanak tanýr. Özellikle Monstera, Pothos, Philodendron ve Begonia türleri bu yöntemle %95 baþarý oraný gösterir.</p>

    <figure class="article-media">
      <img src="/assets/img/p-monstera-1.jpg" alt="Monstera su köklendirme örneði">
      <figcaption>Düðüm noktasýnýn (node) 1 cm altýndan temiz bir kesim yapýlmalýdýr.</figcaption>
    </figure>

    <h2 id="ozellikler">2. Doðru Kesim ve Bitki Seçimi</h2>
    <p>Baþarýlý bir su çoðaltmanýn sýrrý doðru boðumu (node) bulmaktýr. Yaprak sapýnýn ana gövdeye baðlandýðý kahverengi þiþkinlikler, büyüme hormonlarýnýn yoðunlaþtýðý merkezlerdir. Hava kökü taþýyan boðumlar köklenme sürecini iki kat hýzlandýrýr.</p>
    <ul>
      <li>Steril, keskin bir budama makasý veya jilet kullanýn.</li>
      <li>Kesimi 45 derecelik açýyla gerçekleþtirin.</li>
      <li>Suya batacak alt yapraklarý temizleyin; çürümeyi önleyin.</li>
    </ul>

    <h2 id="bakim">3. Su Kalitesi ve Bakým Rutini</h2>
    <p>Musluk suyu yerine dinlendirilmiþ veya filtrelenmiþ oda sýcaklýðýnda su kullanýn. Klor ve florür, hassas taze kök uçlarýna zarar verebilir.</p>
    <p>Iþýk seçimi hayati önem taþýr: Doðrudan yakýcý güneþ almayan, filtrelenmiþ parlak bir pencere önü idealdir. Doðrudan güneþ ýþýðý suyun ýsýnmasýna ve yosunlaþmaya neden olur.</p>

    <h2 id="sulama">4. Su Deðiþimi ve Besleme</h2>
    <p>Suyu haftada bir kez tamamen deðiþtirin. Oksijen seviyesini yüksek tutmak kök hücrelerinin nefes almasýný saðlar. Kökler 5-8 cm uzunluða ulaþtýðýnda ve yan kökçükler oluþturduðunda bitkiniz topraða geçiþe hazýr demektir.</p>

    <h2 id="sonuc">5. Topraða Geçiþ ve Sonuç</h2>
    <p>Su kökleri son derece kýrýlgan ve hidrofildir. Topraða aktarýrken hafif, perlit ve hindistancevizi lifi (coco peat) oraný yüksek bir karýþým kullanýn. Ýlk iki hafta topraðý hafif nemli tutarak adaptasyonu kolaylaþtýrýn.</p>`,
    tag: 'Care Lab',
    cover_image: '/assets/img/hero.jpg',
    read_time: '6 min read',
    author_name: 'Maya Lin',
    author_role: 'Botanical Specialist',
    is_featured: 1,
    is_published: 1
  },
  {
    id: 'repotting-without-drama',
    title: 'Repotting Without the Drama: A 5-Step Ritual',
    excerpt: 'Everything you need to know about root-bound plants, choosing the right soil blend, and stress-free repotting.',
    content: `<p class="lead">Saksý deðiþimi bir kriz aný deðil, bitkinizle kurduðunuz en derin bakým baðýdýr. Doðru tekniklerle kök þokunu sýfýra indirebilirsiniz.</p>

    <h2 id="giris">1. Giriþ: Ne Zaman Saksý Deðiþtirilmeli?</h2>
    <p>Bitkinizin saksý altýndaki drenaj deliklerinden kökler fýrlýyorsa veya sulamadan hemen sonra toprak kuruyorsa kökler saksýyý tamamen sarmýþ demektir. Ýlkbahar ve erken yaz aylarý saksý deðiþimi için en verimli dönemdir.</p>

    <h2 id="ozellikler">2. Saksý ve Toprak Seçimi</h2>
    <p>Mevcut saksý çapýndan yalnýzca 2-4 cm daha geniþ bir saksý seçin. Aþýrý büyük saksýlar, köklerin ulaþamadýðý ýslak toprak bölgeleri yaratarak kök çürümesine yol açar.</p>

    <h2 id="bakim">3. 5 Adýmlý Deðiþim Ritüeli</h2>
    <p>1. Deðiþimden 24 saat önce bitkiyi hafifçe sulayýn.<br>2. Saksýyý yan yatýrýp kenarlarýndan esneterek kök topunu çýkarýn.<br>3. Sýkýþmýþ kökleri parmak uçlarýnýzla nazikçe gevþetin.<br>4. Yeni saksýnýn tabanýna 3 cm havadar toprak serin.<br>5. Bitkiyi merkezleyip kenarlarý toprakla doldurun ve hafifçe bastýrýn.</p>

    <h2 id="sulama">4. Ýlk Can Suyu ve Ýyileþme</h2>
    <p>Yeni saksýya aldýktan sonra drenaj deliklerinden su akana kadar derinlemesine can suyu verin. Bitkiyi bir hafta boyunca doðrudan yakýcý ýþýktan uzak, dinlendirici bir alanda tutun.</p>

    <h2 id="sonuc">5. Sonuç</h2>
    <p>Yeni alanýna yerleþen bitkiniz 3-4 hafta içinde taze sürgünlerle teþekkür edecektir.</p>`,
    tag: 'Guides',
    cover_image: '/assets/img/ch-big-1.jpg',
    read_time: '5 min read',
    author_name: 'Ava Thompson',
    author_role: 'Lead Greenhouse Botanist',
    is_featured: 1,
    is_published: 1
  },
  {
    id: 'reading-your-light',
    title: 'Reading Your Light Like a Plant Does',
    excerpt: 'How photons, window exposure, and indirect rays dictate chlorophyll production and healthy architectural growth.',
    content: `<p class="lead">Iþýk, bitkiler için sadece bir ortam faktörü deðil, besin üretiminin tek kaynaðýdýr. Evinizin ýþýk haritasýný çýkarmayý öðrenin.</p>

    <h2 id="giris">1. Giriþ: Doðal Iþýðýn Dili</h2>
    <p>Ýnsan gözü ýþýk deðiþimlerine hýzla adapte olurken bitkiler foton seviyelerini hassasiyetle ölçer. Bir odanýn ortasýndaki ýþýk miktarý, pencere kenarýndakinin sadece %10'u kadardýr.</p>

    <h2 id="ozellikler">2. Cepheler ve Iþýk Karakteristikleri</h2>
    <p>Güney cepheli pencereler kaktüs ve sukulentler için cennetken, Doðu cephesi sabahýn yumuþak ýþýðýyla Ficus ve Philodendron türleri için mükemmeldir. Kuzey cephesi ise Calathea ve Paþa Kýlýcý için ideal loþ ortamý sunar.</p>

    <h2 id="bakim">3. Iþýk Stresi Belirtileri</h2>
    <p>Yetersiz ýþýkta yaprak aralýklarý uzar (etiolasyon) ve yaprak boyutlarý küçülür. Aþýrý doðrudan ýþýkta ise yapraklarda solgunluk ve kahverengi güneþ yanýklarý oluþur.</p>

    <h2 id="sulama">4. Iþýk ve Sulama Ýliþkisi</h2>
    <p>Daha fazla ýþýk alan bitki daha hýzlý fotosentez yapar ve daha çok su tüketir. Iþýk seviyesi düþtüðünde sulama sýklýðý mutlaka azaltýlmalýdýr.</p>

    <h2 id="sonuc">5. Sonuç</h2>
    <p>Bitkinizi doðru ýþýk penceresine yerleþtirmek, bakýmýn %70'ini tamamlamýþ olmanýz anlamýna gelir.</p>`,
    tag: 'Deep Dive',
    cover_image: '/assets/img/ch-big-2.jpg',
    read_time: '8 min read',
    author_name: 'Marcus Reed',
    author_role: 'Horticultural Editor',
    is_featured: 0,
    is_published: 1
  },
  {
    id: 'beginner-plants',
    title: '5 Plants That Forgive Absolute Beginners',
    excerpt: 'Hardy, sculptural, and practically indestructible houseplant varieties to build confidence in your green thumb.',
    content: `<p class="lead">Bitki yetiþtirmeye yeni baþlayanlarýn korkulu rüyasý solan yapraklardýr. Bu 5 dayanýklý tür, sulamayý unutsanýz bile yaþamaya devam eder.</p>

    <h2 id="giris">1. Giriþ: Dayanýklý Türlerin Anatomisi</h2>
    <p>Hemen her ortam koþuluna uyum saðlayabilen bitkiler, su depolayan etli yaprak yapýlarý ve esnek ýþýk toleranslarýyla öne çýkar.</p>

    <h2 id="ozellikler">2. En Dayanýklý 5 Bitki Listesi</h2>
    <p>1. <strong>Sansevieria (Paþa Kýlýcý):</strong> Haftalarca susuzluða ve az ýþýða meydan okur.<br>2. <strong>ZZ Plant (Zamioculcas):</strong> Yumrulu köklerinde su depolar.<br>3. <strong>Pothos (Salon Sarmaþýðý):</strong> Hýzlý büyür, kesilip kolayca çoðaltýlýr.<br>4. <strong>Monstera Deliciosa:</strong> Heybetli ve dayanýklý bir salon klasiði.<br>5. <strong>Dracaena:</strong> Havadar yapraklarýyla estetik ve zahmetsiz.</p>

    <h2 id="bakim">3. Temel Bakým Kurallarý</h2>
    <p>Az sulamak her zaman çok sulamaktan iyidir. Topraðýn üst 3-4 santimetresi kurumadan sulama yapmayýn.</p>

    <h2 id="sulama">4. Sulama Hatalarýndan Kaçýnma</h2>
    <p>Saksý altýnda biriken fazla suyu mutlaka dökün; köklerin su içinde beklemesine asla izin vermeyin.</p>

    <h2 id="sonuc">5. Sonuç</h2>
    <p>Bu beþ bitkiden biriyle baþlayarak yeþil yolculuðunuza güvenle adým atabilirsiniz.</p>`,
    tag: 'Plant School',
    cover_image: '/assets/img/ch-sq-1.jpg',
    read_time: '5 min read',
    author_name: 'Ava Thompson',
    author_role: 'Lead Greenhouse Botanist',
    is_featured: 0,
    is_published: 1
  }
];

const stmt = db.prepare(`
  INSERT OR REPLACE INTO blog_articles 
  (id, title, excerpt, content, tag, cover_image, read_time, author_name, author_role, is_featured, is_published)
  VALUES (@id, @title, @excerpt, @content, @tag, @cover_image, @read_time, @author_name, @author_role, @is_featured, @is_published)
`);

for (const a of articles) {
  stmt.run(a);
}

console.log('Seeded blog_articles successfully!');
process.exit(0);
