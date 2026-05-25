// ============================================
// KORE. — CSV Loader
// Place OBJECTS_ON_SALE.csv + GENERATOR.csv in assets/
//
// CSV format notes:
//   Files column     → single filename  e.g.  apppuncher.png
//   Close Ups column → filenames separated by /  e.g.  close1.png/close2.png
// ============================================

// ── CSV Parser ─────────────────────────────────────────────────────────────
// Character-by-character so quoted fields with commas/newlines work correctly.

function parseCSV(text) {
  const raw = text.replace(/^\uFEFF/, ''); // strip BOM

  // Split into logical rows, respecting quoted fields
  const rows = [];
  let curRow = '';
  let inQ = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQ && raw[i + 1] === '"') { curRow += '"'; i++; } // escaped quote
      else { inQ = !inQ; curRow += c; }
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && raw[i + 1] === '\n') i++; // skip \r in \r\n
      if (curRow.trim()) rows.push(curRow);
      curRow = '';
    } else {
      curRow += c;
    }
  }
  if (curRow.trim()) rows.push(curRow);
  if (rows.length < 2) return [];

  const headers = parseCSVRow(rows[0]).map(h => h.trim());
  return rows.slice(1).map(row => {
    const values = parseCSVRow(row);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
    return obj;
  }).filter(obj => Object.values(obj).some(v => v !== ''));
}

function parseCSVRow(row) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '"') {
      if (inQ && row[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (c === ',' && !inQ) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// ── File list helpers ──────────────────────────────────────────────────────
function toId(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Parse Close Ups field: supports "/" separator (preferred) or newlines
function parseCloseUps(str) {
  if (!str) return [];
  // Try "/" first; fallback to newline
  const sep = str.includes('/') ? '/' : /[\n\r]/;
  return str.split(sep).map(s => s.trim()).filter(Boolean);
}

// ── Global state ───────────────────────────────────────────────────────────
let products      = [];
let generatorData = [];

const fakeRedditPosts = [
  // Productivity
  { category: 'Productivity',  subreddit: 'r/productivity',       title: "I've tried 12 different todo apps and none of them stick",                    upvotes: '12.3k', comments: '4.1k' },
  { category: 'Productivity',  subreddit: 'r/ADHD',               title: "Why can I hyperfocus on random things but not what actually matters?",         upvotes: '7.2k',  comments: '1.4k' },
  { category: 'Productivity',  subreddit: 'r/GTD',                title: "Getting Things Done sounds great in theory. Reality is different.",            upvotes: '3.8k',  comments: '762'  },
  { category: 'Productivity',  subreddit: 'r/timemanagement',     title: "I lose 3 hours a day to micro-decisions. Send help.",                          upvotes: '5.6k',  comments: '1.1k' },
  { category: 'Productivity',  subreddit: 'r/selfimprovement',    title: "I wake up motivated but crash by 2pm every single day",                        upvotes: '4.5k',  comments: '892'  },
  { category: 'Productivity',  subreddit: 'r/LifeHacks',          title: "Apps that actually helped you get more done — real ones only",                 upvotes: '9.1k',  comments: '2.3k' },
  // Mental Health
  { category: 'Mental Health', subreddit: 'r/Anxiety',            title: "My hands shake in every meeting. People definitely notice.",                   upvotes: '3.1k',  comments: '567'  },
  { category: 'Mental Health', subreddit: 'r/mentalhealth',       title: "Feeling burnt out but can't take time off. Anyone else?",                      upvotes: '8.4k',  comments: '2.1k' },
  { category: 'Mental Health', subreddit: 'r/therapy',            title: "6 months into therapy and still don't know how to describe my feelings",       upvotes: '6.2k',  comments: '1.8k' },
  { category: 'Mental Health', subreddit: 'r/depression',         title: "Some days getting out of bed feels like climbing a mountain",                  upvotes: '14.7k', comments: '5.3k' },
  { category: 'Mental Health', subreddit: 'r/selfcare',           title: "What does 'taking care of yourself' actually look like in practice?",          upvotes: '11.2k', comments: '3.7k' },
  { category: 'Mental Health', subreddit: 'r/DecidingToBeBetter', title: "Feel invisible in every room I walk into. How do I change this?",              upvotes: '9.8k',  comments: '2.7k' },
  // Health
  { category: 'Health',        subreddit: 'r/sleep',              title: "I've not had a full night of sleep in three years",                            upvotes: '18.4k', comments: '6.2k' },
  { category: 'Health',        subreddit: 'r/fitness',            title: "Started 5 different workout programs this year. Finished zero.",               upvotes: '7.9k',  comments: '2.4k' },
  { category: 'Health',        subreddit: 'r/nutrition',          title: "I eat clean 6 days a week and undo it all on Sunday",                          upvotes: '5.3k',  comments: '1.6k' },
  { category: 'Health',        subreddit: 'r/HealthyLiving',      title: "What habit actually moved the needle on your health? Be specific.",            upvotes: '13.6k', comments: '4.8k' },
  { category: 'Health',        subreddit: 'r/loseit',             title: "Scale hasn't moved in 8 weeks. Body has. Don't know how to feel.",             upvotes: '4.1k',  comments: '891'  },
  { category: 'Health',        subreddit: 'r/QuantifiedSelf',     title: "Tracking everything but nothing is changing",                                   upvotes: '2.3k',  comments: '389'  },
  // Glow Up
  { category: 'Glow up',       subreddit: 'r/SkincareAddiction',  title: "Used the same skincare routine for 2 years. Zero results.",                    upvotes: '6.4k',  comments: '1.9k' },
  { category: 'Glow up',       subreddit: 'r/malefashionadvice',  title: "I dress the same every day because decisions are exhausting",                  upvotes: '4.7k',  comments: '1.2k' },
  { category: 'Glow up',       subreddit: 'r/femalefashionadvice',title: "Wardrobe full of clothes and nothing to wear — this is real",                  upvotes: '8.9k',  comments: '3.1k' },
  { category: 'Glow up',       subreddit: 'r/confidence',         title: "I overthink every single social interaction after it happens",                 upvotes: '11.3k', comments: '4.2k' },
  { category: 'Glow up',       subreddit: 'r/socialskills',       title: "Conversations end the moment they start when I'm involved",                    upvotes: '5.6k',  comments: '1.1k' },
  { category: 'Glow up',       subreddit: 'r/selfimprovement',    title: "I've rehearsed how to introduce myself 200 times and still stumble",           upvotes: '7.2k',  comments: '2.5k' },
];

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomUpvotes()  { return randFrom(['1.2k','2.4k','3.1k','4.5k','5.6k','7.2k','8.1k','9.8k','11.2k']); }
function randomComments() { return randFrom(['241','318','441','507','678','892','1.1k','1.4k','2.3k']); }

// ── Products ───────────────────────────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await fetch('assets/OBJECTS_ON_SALE.csv');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = parseCSV(await res.text());

    products = rows.map(r => {
      // Files → single main image (trim, take whole value — one filename)
      const mainImage = (r['Files'] || r['files'] || '').trim();
      // Close Ups → array of extra images, "/" separated
      const closeUps  = parseCloseUps(r['Close Ups'] || r['close ups'] || r['CloseUps'] || '');

      return {
        id:          toId(r['Name'] || r['name'] || ''),
        name:        (r['Name'] || r['name'] || '').toUpperCase(),
        subtitle:    r['Subtitle']    || r['subtitle']    || '',
        description: r['Description'] || r['description'] || '',
        price:       r['Price']       || r['price']       || '0',
        user:        r['User']        || r['user']        || '',
        link:        r['Link']        || r['link']        || '#',
        month:       r['Month']       || r['month']       || '',
        collection:  r['Collection']  || r['collection']  || '',
        mainImage,   // string — one filename or ''
        closeUps,    // string[] — 0..N filenames
      };
    }).filter(p => p.id && p.name);

    console.log(`✅ KORE. ${products.length} products loaded`);
    products.forEach(p => console.log(`  ${p.name} | main: ${p.mainImage} | closeUps: [${p.closeUps.join(', ')}]`));
  } catch (e) {
    console.warn('⚠️ Could not load OBJECTS_ON_SALE.csv:', e.message);
    products = [];
  }
}

// ── Generator ──────────────────────────────────────────────────────────────
async function loadGenerator() {
  try {
    const res = await fetch('assets/GENERATOR.csv');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = parseCSV(await res.text());

    generatorData = rows.map(r => {
      const url          = r['Url'] || r['url'] || '';
      const solutionName = (r['Solution'] || r['solution'] || '').toUpperCase();
      const matched      = products.find(p => p.name === solutionName)
                        || products.find(p => solutionName && p.name.startsWith(solutionName.split(' ')[0]));
      const subMatch     = url.match(/reddit\.com\/r\/([^/]+)/);
      const slugMatch    = url.match(/comments\/[^/]+\/([^/]+)/);
      const titleFromSlug = slugMatch ? slugMatch[1].replace(/_/g, ' ') : solutionName;

      return {
        url,
        subreddit:  subMatch ? `r/${subMatch[1]}` : 'r/reddit',
        postTitle:  titleFromSlug,
        postBody:   '',
        upvotes:    randomUpvotes(),
        comments:   randomComments(),
        thematic:   r['Thematic'] || r['thematic'] || '',
        context:    r['Context']  || r['context']  || '',
        emotion:    r['Emotion']  || r['emotion']  || '',
        need:       r['Need']     || r['need']     || '',
        object1:    r['Objet 1']  || r['Object 1'] || '',
        object2:    r['Object 2'] || r['object2']  || '',
        solution:   solutionName,
        productId:  matched ? matched.id : toId(solutionName),
        file:       r['file'] || r['File'] || '',
      };
    }).filter(g => g.url);

    await Promise.all(generatorData.map(g => fetchRedditPost(g)));
    console.log(`✅ KORE. ${generatorData.length} generator entries loaded`);
  } catch (e) {
    console.warn('⚠️ Could not load GENERATOR.csv:', e.message);
    generatorData = [];
  }
}

async function fetchRedditPost(entry) {
  try {
    const jsonUrl = entry.url.replace(/\/?$/, '.json') + '?limit=1';
    const res = await fetch(jsonUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    const post = data?.[0]?.data?.children?.[0]?.data;
    if (!post) return;
    if (post.title)        entry.postTitle  = post.title;
    if (post.selftext)     entry.postBody   = post.selftext;
    if (post.score)        entry.upvotes    = fmtNum(post.score);
    if (post.num_comments) entry.comments   = fmtNum(post.num_comments);
    if (post.subreddit)    entry.subreddit  = `r/${post.subreddit}`;
  } catch (_) {}
}

function fmtNum(n) {
  if (!n && n !== 0) return null;
  return n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n);
}

// ── Fake Reddit Posts from CSV ─────────────────────────────────────────────
async function loadFakePosts() {
  try {
    const res = await fetch('assets/FAKE_REDDIT_POSTS.csv');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = parseCSV(await res.text());

    const entries = rows.map(r => {
      const url      = (r['url'] || r['Url'] || '').trim();
      const category = (r['category'] || r['Category'] || '').trim();
      if (!url) return null;

      const subMatch  = url.match(/reddit\.com\/r\/([^/]+)/);
      const slugMatch = url.match(/comments\/[^/]+\/([^/]+)/);
      const fallback  = slugMatch ? slugMatch[1].replace(/_/g, ' ') : 'Reddit post';

      return {
        url,
        category,
        subreddit: subMatch ? `r/${subMatch[1]}` : 'r/reddit',
        title:    fallback,
        upvotes:  randomUpvotes(),
        comments: randomComments(),
      };
    }).filter(Boolean);

    // Try to enrich with real Reddit data (title, score, comments)
    await Promise.all(entries.map(async e => {
      try {
        const jsonUrl = e.url.replace(/\/?$/, '.json') + '?limit=1';
        const r2 = await fetch(jsonUrl, { headers: { 'Accept': 'application/json' } });
        if (!r2.ok) return;
        const data = await r2.json();
        const post = data?.[0]?.data?.children?.[0]?.data;
        if (!post) return;
        if (post.title)        e.title     = post.title;
        if (post.score)        e.upvotes   = fmtNum(post.score);
        if (post.num_comments) e.comments  = fmtNum(post.num_comments);
        if (post.subreddit)    e.subreddit = `r/${post.subreddit}`;
      } catch (_) {}
    }));

    fakeRedditPosts.push(...entries);
    console.log(`✅ KORE. ${entries.length} fake posts loaded from CSV`);
  } catch (e) {
    console.warn('⚠️ Could not load FAKE_REDDIT_POSTS.csv:', e.message);
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
async function initKORE() {
  await loadProducts();
  await Promise.all([loadGenerator(), loadFakePosts()]);
  if (typeof window.onDataReady === 'function') window.onDataReady();
}
