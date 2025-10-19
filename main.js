import fastify from "fastify";
import cors from "@fastify/cors";
import WebSocket from "ws";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import fetch from "node-fetch";

const app = fastify({ logger: true });


await app.register(cors, { origin: "*" });

const PORT = 3000; 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/api/taixiu/sunwin", async () => {
  const valid = rikResults.filter((r) => r.dice?.length === 3);
  const totalPredict =
    predictionStats.totalCorrect + predictionStats.totalIncorrect;
  const correctRate =
    totalPredict > 0
      ? (predictionStats.totalCorrect / totalPredict) * 100
      : 0;

  if (!valid.length) {
    return {
      message: "Không có dữ liệu.",
      thong_ke_hieu_suat_he_thong: {
        tong_so_lan_du_doan: totalPredict,
        tong_lan_thang: predictionStats.totalCorrect,
        tong_lan_thua: predictionStats.totalIncorrect,
        ty_le_thang: `${correctRate.toFixed(2)}%`,
      },
      du_doan_moi_nhat: seiuManager.currentPrediction
        ? {
            phien_du_doan: valid.at(0)?.session + 1 || "N/A",
            du_doan: seiuManager.currentPrediction.prediction,
            ty_le_thanh_cong_du_doan: `${(
              seiuManager.currentPrediction.confidence * 100
            ).toFixed(0)}%`,
            giai_thich:
              "Dự đoán bởi thuật toán kết hợp đa mô hình (SEIU-MAX-UPGRADE)",
          }
        : null,
    };
  }

  const current = valid[0];
  const { session, dice, total, result } = current;
  const prediction = seiuManager.getPrediction();

  return {
    id: "@địt mẹ mày",
    phien_cuoi_cung_co_ket_qua: session,
    xuc_xac_1: dice[0],
    xuc_xac_2: dice[1],
    xuc_xac_3: dice[2],
    tong: total,
    ket_qua: result,
    du_doan_phien_tiep_theo: prediction.prediction,
    ty_le_thanh_cong_du_doan: `${(prediction.confidence * 100).toFixed(0)}%`,
    thong_ke_hieu_suat_he_thong: {
      tong_so_lan_du_doan: totalPredict,
      tong_lan_thang: predictionStats.totalCorrect,
      tong_lan_thua: predictionStats.totalIncorrect,
      ty_le_thang: `${correctRate.toFixed(2)}%`,
    },
    giai_thich:
      "Dự đoán bởi thuật toán kết hợp đa mô hình (SEIU-MAX-UPGRADE)",
    trong_so_cac_thuat_toan: seiuManager.ensemble.weights,
  };
});

app.get("/api/taixiu/history", async () => {
  const valid = rikResults.filter((r) => r.dice?.length === 3);
  if (!valid.length) return { message: "Không có dữ liệu lịch sử." };
  return valid.map((i) => ({
    session: i.session,
    dice: i.dice,
    total: i.total,
    result: i.result,
    tx_label: i.total >= 11 ? "T" : "X",
  }));
});

app.get("/api/taixiu/stats", async () => {
  const total =
    predictionStats.totalCorrect + predictionStats.totalIncorrect;
  const correctRate =
    total > 0 ? (predictionStats.totalCorrect / total) * 100 : 0;
  return {
    totalCorrect: predictionStats.totalCorrect,
    totalIncorrect: predictionStats.totalIncorrect,
    totalSessions: total,
    correctRate: `${correctRate.toFixed(2)}%`,
  };
});

app.get("/", async () => {
  return { status: "ok", msg: "Server chạy thành công 🚀" };
});


const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {

    const fs = await import("node:fs");
    const logFile = path.join(__dirname, "server-error.log");
    const errorMsg = `
================= SERVER ERROR =================
Time: ${new Date().toISOString()}
Error: ${err.message}
Stack: ${err.stack}
Port: ${PORT}
Host: 0.0.0.0
Check: Port bị chiếm, firewall chưa mở, hoặc quyền admin chưa có.
=================================================
`;
    console.error(errorMsg);


    fs.writeFileSync(logFile, errorMsg, { encoding: "utf8", flag: "a+" });

    process.exit(1); 
  }

  let publicIP = "0.0.0.0";
  try {
    const res = await fetch("https://ifconfig.me/ip");
    publicIP = (await res.text()).trim();
  } catch (e) {
    console.error("❌ Lỗi lấy public IP:", e.message);
  }

  console.log("\n🚀 Server đã chạy thành công!");
  console.log(`   ➜ Local:   http://localhost:${PORT}/`);
  console.log(`   ➜ Network: http://${publicIP}:${PORT}/\n`);

  console.log("📌 Các API endpoints:");
  console.log(`   ➜ GET /               → http://${publicIP}:${PORT}/`);
  console.log(
    `   ➜ GET /api/taixiu/sunwin   → http://${publicIP}:${PORT}/api/taixiu/sunwin`
  );
  console.log(
    `   ➜ GET /api/taixiu/history  → http://${publicIP}:${PORT}/api/taixiu/history`
  );
  console.log(
    `   ➜ GET /api/taixiu/stats    → http://${publicIP}:${PORT}/api/taixiu/stats`
  );
};

start();
// CẤU HÌNH CẦN THIẾT
const WS_URL = "wss://websocket.azhkthg1.net/wsbinary?token=";
// LƯU Ý: TOKEN NÀY CÓ THỂ ĐÃ HẾT HẠN, CẦN CẬP NHẬT LẠI.
const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiJ0dXNlbmFhYV9hbnJhdW0iLCJib3QiOjAsImlzTWVyY2hhbnQiOmZhbHNlLCJ2ZXJpZmllZEJhbmtBY2NvdW50IjpmYWxzZSwicGxheUV2ZW50TG9iYnkiOmZhbHNlLCJjdXN0b21lcklkIjozMjE5NzA2MTAsImFmZklkIjoiU3Vud2luIiwiYmFubmVkIjpmYWxzZSwiYnJhbmQiOiJzdW4ud2luIiwidGltZXN0YW1wIjoxNzYwODQyODQ2OTIxLCJsb2NrR2FtZXMiOltdLCJhbW91bnQiOjAsImxvY2tDaGF0IjpmYWxzZSwicGhvbmVWZXJpZmllZCI6ZmFsc2UsImlwQWRkcmVzcyI6IjExNi45Ny4xMDguMTkzIiwibXV0ZSI6ZmFsc2UsImF2YXRhciI6Imh0dHBzOi8vaW1hZ2VzLnN3aW5zaG9wLm5ldC9pbWFnZXMvYXZhdGFyL2F2YXRhcl8xNi5wbmciLCJwbGF0Zm9ybUlkIjo1LCJ1c2VySWQiOiIyNjlhNWM0Zi02MjRmLTRkN2YtYWFjZC0xYjdkODFhYjg4ZjYiLCJyZWdUaW1lIjoxNzYwODQyNjc2NTM4LCJwaG9uZSI6IiIsImRlcG9zaXQiOmZhbHNlLCJ1c2VybmFtZSI6IlNDX3R1c2VuYXJhdW1ha2trIn0.amlz7LZgAYIBAyPOHc6PxsYexGB00syghTAj8d6eE3c";

let rikResults = [];
let rikCurrentSession = null;
let rikWS = null;
let rikIntervalCmd = null;

// Thêm biến thống kê
const predictionStats = {
    totalCorrect: 0,
    totalIncorrect: 0,
    lastPrediction: null
};

// ================= UTILITIES =================
function parseLines(lines) {
    const arr = lines.map(l => (typeof l === 'string' ? JSON.parse(l) : l));
    return arr.map(item => ({
        session: item.session,
        dice: item.dice,
        total: item.total,
        result: item.result,
        tx: item.total >= 11 ? 'T' : 'X'
    })).sort((a, b) => a.session - b.session);
}

function lastN(arr, n) {
    return arr.slice(Math.max(0, arr.length - n));
}

function unique(arr) {
    return Array.from(new Set(arr));
}

function majority(obj) {
    let maxK = null,
        maxV = -Infinity;
    for (const k in obj)
        if (obj[k] > maxV) {
            maxV = obj[k];
            maxK = k;
        }
    return {
        key: maxK,
        val: maxV
    };
}

function sum(nums) {
    return nums.reduce((a, b) => a + b, 0);
}

function avg(nums) {
    return nums.length ? sum(nums) / nums.length : 0;
}

function entropy(arr) {
    if (!arr.length) return 0;
    const freq = arr.reduce((a, v) => {
        a[v] = (a[v] || 0) + 1;
        return a;
    }, {});
    const n = arr.length;
    let e = 0;
    for (const k in freq) {
        const p = freq[k] / n;
        e -= p * Math.log2(p);
    }
    return e;
}

function similarity(a, b) {
    if (a.length !== b.length) return 0;
    let m = 0;
    for (let i = 0; i < a.length; i++)
        if (a[i] === b[i]) m++;
    return m / a.length;
}

function extractFeatures(history) {
    const tx = history.map(h => h.tx);
    const totals = history.map(h => h.total);
    const features = {
        tx,
        totals,
        freq: tx.reduce((a, v) => {
            a[v] = (a[v] || 0) + 1;
            return a;
        }, {})
    };

    let runs = [],
        cur = tx[0],
        len = 1;
    for (let i = 1; i < tx.length; i++) {
        if (tx[i] === cur) len++;
        else {
            runs.push({
                val: cur,
                len
            });
            cur = tx[i];
            len = 1;
        }
    }
    if (tx.length) runs.push({
        val: cur,
        len
    });
    features.runs = runs;
    features.maxRun = runs.reduce((m, r) => Math.max(m, r.len), 0) || 0;

    features.meanTotal = avg(totals);
    features.stdTotal = Math.sqrt(avg(totals.map(t => Math.pow(t - features.meanTotal, 2))));
    features.entropy = entropy(tx);

    return features;
}

// ================= CORE ALGORITHMS (Mã cũ giữ nguyên) =================
function algo1_cycle3(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 6) return null;
    const p = tx.slice(-6, -3).join('');
    const q = tx.slice(-3).join('');
    if (p === q) return tx.at(-1) === 'T' ? 'X' : 'T';
    return null;
}

function algo2_alternate2(history) {
    const tx = history.map(h => h.tx).slice(-4);
    if (tx.length < 4) return null;
    if (tx[0] !== tx[1] && tx[1] === tx[2] && tx[2] !== tx[3]) {
        return tx.at(-1) === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo3_threeRepeat(history) {
    const tx = history.map(h => h.tx);
    const last3 = tx.slice(-3);
    if (last3.length === 3 && last3[0] === last3[1] && last3[1] === last3[2]) {
        return last3[0] === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo4_double2pattern(history) {
    const tx = history.map(h => h.tx).slice(-4);
    if (tx.length === 4 && tx[0] === tx[1] && tx[2] === tx[3] && tx[0] !== tx[2]) {
        return tx.at(-1) === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo5_freqRebalance(history) {
    const tx = history.map(h => h.tx);
    const freq = tx.reduce((a, v) => {
        a[v] = (a[v] || 0) + 1;
        return a;
    }, {});
    if ((freq['T'] || 0) > (freq['X'] || 0) + 2) return 'X'; // Nâng cấp: chỉ đảo ngược khi chênh lệch đáng kể
    if ((freq['X'] || 0) > (freq['T'] || 0) + 2) return 'T'; // Nâng cấp
    return null;
}

function algo6_longRunReversal(history) {
    const f = extractFeatures(history);
    if (f.runs.at(-1)?.len >= 5) { // Nâng cấp: Tăng ngưỡng lên 5
        return history.at(-1).tx === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo7_threePatternReversal(history) {
    const tx = history.map(h => h.tx).slice(-3);
    if (tx.length === 3 && tx[0] !== tx[1] && tx[1] === tx[2]) {
        return tx.at(-1) === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo9_twoOneSwitch(history) {
    const tx = history.map(h => h.tx).slice(-3);
    if (tx.length === 3 && tx[0] === tx[1] && tx[1] !== tx[2]) {
        return tx[2] === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo10_newSequenceFollow(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 10) return null; // Nâng cấp: tăng ngưỡng
    const last10 = tx.slice(-10).join('');
    if (!tx.slice(0, -10).join('').includes(last10)) return tx.at(-1); // Tiếp tục xu hướng
    return null;
}

function algoA_markov(history) {
    const tx = history.map(h => h.tx);
    const order = 3;
    if (tx.length < order + 1) return null;
    const transitions = {};
    for (let i = 0; i <= tx.length - order - 1; i++) {
        const key = tx.slice(i, i + order).join('');
        const next = tx[i + order];
        transitions[key] = transitions[key] || {
            T: 0,
            X: 0
        };
        transitions[key][next]++;
    }
    const lastKey = tx.slice(-order).join('');
    const counts = transitions[lastKey];
    if (!counts) return null;
    if (counts.T === counts.X) return null; // Nâng cấp: không dự đoán khi bằng nhau
    return (counts['T'] > counts['X']) ? 'T' : 'X';
}

function algoB_ngram(history) {
    const tx = history.map(h => h.tx);
    const k = 4;
    if (tx.length < k + 1) return null;
    const lastGram = tx.slice(-k).join('');
    let counts = {
        T: 0,
        X: 0
    };
    for (let i = 0; i <= tx.length - k - 1; i++) {
        const gram = tx.slice(i, i + k).join('');
        if (gram === lastGram) counts[tx[i + k]]++;
    }
    if (counts.T === counts.X) return null;
    return counts.T > counts.X ? 'T' : 'X';
}

function algoC_entropy(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 20) return null; // Nâng cấp: tăng ngưỡng
    const eRecent = entropy(tx.slice(-10)); // Nâng cấp: cửa sổ 10
    const eOlder = entropy(tx.slice(0, Math.max(0, tx.length - 10)));
    if (eRecent < 0.8 && eOlder - eRecent > 0.15) { // Nâng cấp: Giảm ngưỡng để bắt trend sớm hơn
        return tx.at(-1); // Duy trì xu hướng (Low Entropy -> Có xu hướng)
    }
    if (eRecent > 1.0 && eRecent - eOlder > 0.15) {
        return tx.at(-1) === 'T' ? 'X' : 'T'; // Đảo ngược (High Entropy -> ngẫu nhiên, hay đổi)
    }
    return null;
}

function algoD_dicePattern(history) {
    const map = {};
    for (const h of history) {
        const d = h.dice;
        const uniq = unique(d);
        let kind = 'distinct';
        if (uniq.length === 1) kind = 'triple';
        else if (uniq.length === 2) kind = 'pair';
        map[kind] = map[kind] || {
            T: 0,
            X: 0
        };
        map[kind][h.tx] = (map[kind][h.tx] || 0) + 1;
    }
    const lastDice = history.at(-1).dice;
    const lastKind = unique(lastDice).length === 1 ? 'triple' : (unique(lastDice).length === 2 ? 'pair' : 'distinct');
    const counts = map[lastKind];
    if (!counts) return null;
    if (counts.T === counts.X) return null;
    return counts.T > counts.X ? 'T' : 'X';
}

function algoE_runMomentum(history) {
    const runs = extractFeatures(history).runs;
    if (runs.length < 3) return null;
    const lastRuns = runs.slice(-3).map(r => r.len);
    if (lastRuns.length < 3) return null;
    // Tăng tốc: 1 -> 2 -> 3 (Tiếp tục)
    if (lastRuns[2] > lastRuns[1] && lastRuns[1] > lastRuns[0] && lastRuns[2] >= 3) { // Nâng cấp: Chỉ xét khi run cuối >= 3
        return history.at(-1).tx;
    }
    // Giảm tốc: 3 -> 2 -> 1 (Đảo ngược)
    if (lastRuns[2] < lastRuns[1] && lastRuns[1] < lastRuns[0] && lastRuns[0] >= 3) {
        return history.at(-1).tx === 'T' ? 'X' : 'T';
    }
    return null;
}

function algoF_windowSimilarity(history) {
    const tx = history.map(h => h.tx);
    const win = 6; // Nâng cấp: Cửa sổ 6
    if (tx.length < win * 2 + 1) return null;
    const target = tx.slice(-win).join('');
    let best = {
        score: -1,
        next: null,
        counts: {
            T: 0,
            X: 0
        }
    };
    for (let i = 0; i <= tx.length - win - 1 - win; i++) {
        const w = tx.slice(i, i + win).join('');
        const score = similarity(w, target);
        if (score > 0.6) { // Nâng cấp: Chỉ xét khi độ tương đồng > 60%
            best.counts[tx[i + win]]++;
        }
    }
    if (best.counts.T === best.counts.X) return null;
    return best.counts.T > best.counts.X ? 'T' : 'X';
}

function algoG_fibonacciPattern(history) {
    const tx = history.map(h => h.tx);
    const fib = [1, 2, 3, 5, 8]; // Giảm bớt số lượng fib
    for (const n of fib) {
        if (tx.length < n * 2 + 1) continue;
        const pat1 = tx.slice(-n).join('');
        const pat2 = tx.slice(-2 * n, -n).join('');
        if (pat1 === pat2) {
            // Nếu 2 đoạn bằng nhau, dự đoán đoạn tiếp theo sẽ lặp lại đoạn đầu tiên của pat1 (tức là pat1[0])
            return tx.at(-n); // Theo lý thuyết chu kỳ lặp lại
        }
    }
    return null;
}

function algoH_lastDiceTotal(history) {
    const lastTotal = history.at(-1)?.total;
    if (!lastTotal) return null;
    // Nếu kết quả vừa ra là chẵn thì xu hướng sẽ ra lẻ (đảo ngược)
    if (lastTotal % 2 === 0) {
        return lastTotal >= 11 ? 'X' : 'T'; // Chẵn Tài -> Xỉu, Chẵn Xỉu -> Tài
    } else {
        return lastTotal >= 11 ? 'T' : 'X'; // Lẻ Tài -> Tài, Lẻ Xỉu -> Xỉu
    }
}

function algoI_runLengthDistribution(history) {
    const runs = extractFeatures(history).runs;
    if (runs.length < 8) return null; // Nâng cấp: cần lịch sử dài hơn
    const lastRun = runs.at(-1);
    const avgRun = avg(runs.slice(0, -1).map(r => r.len));
    if (lastRun.len > avgRun * 2 && lastRun.len >= 4) { // Nâng cấp: Chạy dài gấp đôi trung bình và >= 4
        return lastRun.val === 'T' ? 'X' : 'T';
    }
    return null;
}

function algoJ_statisticalAnomalies(history) {
    const tx = history.map(h => h.tx);
    const freq = extractFeatures(history).freq;
    const total = tx.length;
    if (total < 50) return null; // Nâng cấp: cần lịch sử dài hơn
    // Độ lệch > 15% so với 50%
    if ((freq['T'] / total) > 0.65) return 'X';
    if ((freq['X'] / total) > 0.65) return 'T';
    return null;
}

function algoK_NgramPlus(history) {
    const tx = history.map(h => h.tx);
    const k = 5;
    if (tx.length < k + 1) return null;
    const lastGram = tx.slice(-k).join('');
    let counts = {
        T: 0,
        X: 0
    };
    for (let i = 0; i < tx.length - k; i++) {
        const gram = tx.slice(i, i + k).join('');
        if (gram === lastGram) {
            counts[tx[i + k]]++;
        }
    }
    if (counts.T === 0 && counts.X === 0) return null;
    if (counts.T === counts.X) return null; // Nâng cấp
    return counts.T > counts.X ? 'T' : 'X';
}

function algoL_PatternMatchingDynamic(history) {
    const tx = history.map(h => h.tx);
    const len = tx.length;
    if (len < 12) return null;
    const lastPattern = tx.slice(-6).join(''); // Nâng cấp: Mẫu 6
    let predictions = [];
    for (let i = 0; i <= len - 7; i++) {
        const pattern = tx.slice(i, i + 6).join('');
        if (pattern === lastPattern) {
            predictions.push(tx[i + 6]);
        }
    }
    if (predictions.length > 0) {
        const freq = predictions.reduce((a, v) => {
            a[v] = (a[v] || 0) + 1;
            return a;
        }, {});
        return freq['T'] > freq['X'] ? 'T' : (freq['X'] > freq['T'] ? 'X' : null);
    }
    return null;
}

function algoM_RecentBias(history) {
    const tx = history.map(h => h.tx);
    const recentHistory = lastN(tx, 10); // Nâng cấp: Xem 10 phiên gần nhất
    const freq = recentHistory.reduce((a, v) => {
        a[v] = (a[v] || 0) + 1;
        return a;
    }, {});
    if (freq['T'] > freq['X'] + 4) return 'X'; // Nâng cấp: Đảo ngược nếu chênh lệch lớn hơn 4 (để cân bằng)
    if (freq['X'] > freq['T'] + 4) return 'T'; // Nâng cấp
    return null;
}

function algoN_MartingaleReversal(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 5) return null;
    const last5 = tx.slice(-5);
    const uniqueCount = unique(last5).length;
    if (uniqueCount === 1) {
        return last5[0] === 'T' ? 'X' : 'T';
    }
    return null;
}

// ================= SIÊU THUẬT TOÁN MỚI (SUPER ALGORITHMS) =================

/**
 * Super Algo 1: Adaptive N-Gram (N-Gram Tự Điều Chỉnh)
 * Tìm kiếm N-Gram tối ưu (N=3 đến N=5) dựa trên độ chính xác lịch sử.
 */
function algoO_AdaptiveNgram(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 10) return null;
    let bestPred = null;
    let maxCount = -1;

    for (let k = 3; k <= 5; k++) { // Kiểm tra N=3, 4, 5
        if (tx.length < k + 1) continue;
        const lastGram = tx.slice(-k).join('');
        let counts = {
            T: 0,
            X: 0
        };

        for (let i = 0; i < tx.length - k; i++) {
            const gram = tx.slice(i, i + k).join('');
            if (gram === lastGram) {
                counts[tx[i + k]]++;
            }
        }

        if (counts.T !== counts.X) {
            const currentMax = Math.max(counts.T, counts.X);
            if (currentMax > maxCount) {
                maxCount = currentMax;
                bestPred = counts.T > counts.X ? 'T' : 'X';
            }
        }
    }
    return bestPred;
}

/**
 * Super Algo 2: Dice Total Mean Reversion (Hồi Quy Trung Bình Tổng Xúc Xắc)
 * Dự đoán dựa trên xu hướng Tài/Xỉu ngược lại khi tổng điểm xúc xắc chênh lệch xa trung bình.
 */
function algoP_MeanReversion(history) {
    const totals = history.map(h => h.total);
    if (totals.length < 10) return null;
    const features = extractFeatures(history);
    const lastTotal = totals.at(-1);
    const mean = features.meanTotal;
    const std = features.stdTotal;

    if (std === 0) return null; // Tránh chia cho 0

    // Nếu tổng điểm quá cao (ví dụ: > 2 độ lệch chuẩn) -> Dự đoán ngược lại (Xỉu)
    if (lastTotal > mean + 2 * std && lastTotal >= 14) { // Cực Tài
        return 'X';
    }

    // Nếu tổng điểm quá thấp (ví dụ: < 2 độ lệch chuẩn) -> Dự đoán ngược lại (Tài)
    if (lastTotal < mean - 2 * std && lastTotal <= 7) { // Cực Xỉu
        return 'T';
    }
    return null;
}

/**
 * Super Algo 3: Sequence Symmetry Reversal (Đảo Ngược Đối Xứng Chuỗi)
 * Phát hiện một chuỗi con đối xứng (ví dụ: TXT, TXXT) và dự đoán ngược lại.
 */
function algoQ_SymmetryReversal(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 7) return null;
    // Kiểm tra mẫu 1-3-1 (Ví dụ: TXXX T)
    const pat5 = tx.slice(-5);
    if (pat5.length === 5 && pat5[0] === pat5[4] && pat5[1] === pat5[2] && pat5[2] === pat5[3] && pat5[0] !== pat5[1]) {
        return pat5[4] === 'T' ? 'X' : 'T';
    }

    // Kiểm tra mẫu 2-3 (Ví dụ: XXTTT) -> Đảo
    const pat5_2 = tx.slice(-5);
    if (pat5_2.length === 5 && pat5_2[0] === pat5_2[1] && pat5_2[2] === pat5_2[3] && pat5_2[3] === pat5_2[4] && pat5_2[0] !== pat5_2[2]) {
        return pat5_2.at(-1) === 'T' ? 'X' : 'T';
    }

    return null;
}

/**
 * Super Algo 4: Statistical Persistence (Duy Trì Thống Kê)
 * Dự đoán sẽ tiếp tục kết quả vừa ra nếu nó đang có tần suất thấp hơn mức trung bình chung.
 */
function algoR_StatisticalPersistence(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 30) return null;
    const features = extractFeatures(history);
    const total = tx.length;
    const last = tx.at(-1);
    const lastFreq = (features.freq[last] || 0) / total;

    // Nếu tần suất của kết quả vừa ra (last) < 48% (tức là nó đang "bị kìm nén")
    if (lastFreq < 0.48) {
        // Dự đoán tiếp tục ra kết quả đó (để cân bằng về 50%)
        return last;
    }

    return null;
}


// ================= ENSEMBLE CLASSIFIER (Nâng cấp cơ chế trọng số) =================
class SEIUEnsemble {
    constructor(algorithms, opts = {}) {
        this.algs = algorithms;
        this.weights = {};
        this.emaAlpha = opts.emaAlpha ?? 0.1; // Giảm alpha xuống 0.1 để trọng số ổn định hơn
        this.minWeight = opts.minWeight ?? 0.001; // Giảm minWeight
        this.historyWindow = opts.historyWindow ?? 500; // Tăng cửa sổ lịch sử để tính trọng số ban đầu chính xác hơn
        // Khởi tạo trọng số bằng 1 cho tất cả thuật toán
        for (const a of algorithms) this.weights[a.id] = 1;
    }

    fitInitial(history) {
        const window = lastN(history, this.historyWindow);
        if (window.length < 10) return; // Chỉ fit khi có đủ lịch sử
        const algScores = {};
        for (const a of this.algs) algScores[a.id] = 0;

        // Dùng lịch sử để tính điểm ban đầu
        for (let i = 3; i < window.length; i++) {
            const prefix = window.slice(0, i);
            const actual = window[i].tx;
            for (const a of this.algs) {
                const pred = a.fn(prefix);
                if (pred && pred === actual) algScores[a.id]++;
            }
        }

        let total = 0;
        for (const id in algScores) {
            // Trọng số ban đầu là (Số lần dự đoán đúng + 1)
            const w = (algScores[id] || 0) + 1;
            this.weights[id] = w;
            total += w;
        }
        // Chuẩn hóa trọng số
        for (const id in this.weights) this.weights[id] = Math.max(this.minWeight, this.weights[id] / total);

        console.log(`⚖️ Đã khởi tạo ${Object.keys(this.weights).length} trọng số. Tổng: ${total.toFixed(0)}`);
    }

    updateWithOutcome(historyPrefix, actualTx) {
        let totalWeightChange = 0;
        for (const a of this.algs) {
            const pred = a.fn(historyPrefix);
            const correct = pred === actualTx ? 1 : 0;
            const currentWeight = this.weights[a.id] || this.minWeight;

            // Nâng cấp logic: Thưởng/Phạt lớn hơn dựa trên sự tự tin của thuật toán.
            const reward = correct ? 1.05 : 0.95; // Thưởng 5%, Phạt 5%
            const targetWeight = currentWeight * reward;

            // Cập nhật trọng số bằng EMA
            const nw = this.emaAlpha * targetWeight + (1 - this.emaAlpha) * currentWeight;

            this.weights[a.id] = Math.max(this.minWeight, nw);
            totalWeightChange += nw;
        }

        // Chuẩn hóa lại trọng số
        const s = Object.values(this.weights).reduce((a, b) => a + b, 0) || 1;
        for (const id in this.weights) this.weights[id] /= s;
    }

    predict(history) {
        const votes = {};
        for (const a of this.algs) {
            const pred = a.fn(history);
            if (!pred) continue;
            // Thuật toán kết hợp chỉ dựa trên trọng số đã tính
            votes[pred] = (votes[pred] || 0) + (this.weights[a.id] || 0);
        }

        if (!votes['T'] && !votes['X']) {
            const fallback = algo5_freqRebalance(history) || 'T';
            return {
                prediction: fallback === 'T' ? 'Tài' : 'Xỉu',
                confidence: 0.5,
                votes,
                rawPrediction: fallback
            };
        }

        const {
            key: best,
            val: bestVal
        } = majority(votes);
        const total = Object.values(votes).reduce((a, b) => a + b, 0);
        // Tăng độ tự tin: min 0.51, max 0.99
        const confidence = Math.min(0.99, Math.max(0.51, total > 0 ? bestVal / total : 0.51));

        return {
            prediction: best === 'T' ? 'Tài' : 'Xỉu',
            confidence,
            votes,
            rawPrediction: best
        };
    }
}

// ================= DANH SÁCH THUẬT TOÁN ĐẦY ĐỦ =================
const ALL_ALGS = [{
    id: 'algo1_cycle3',
    fn: algo1_cycle3
}, {
    id: 'algo2_alternate2',
    fn: algo2_alternate2
}, {
    id: 'algo3_threeRepeat',
    fn: algo3_threeRepeat
}, {
    id: 'algo4_double2pattern',
    fn: algo4_double2pattern
}, {
    id: 'algo5_freqRebalance',
    fn: algo5_freqRebalance
}, {
    id: 'algo6_longRunReversal',
    fn: algo6_longRunReversal
}, {
    id: 'algo7_threePatternReversal',
    fn: algo7_threePatternReversal
}, {
    id: 'algo9_twoOneSwitch',
    fn: algo9_twoOneSwitch
}, {
    id: 'algo10_newSequenceFollow',
    fn: algo10_newSequenceFollow
}, {
    id: 'A_markov',
    fn: algoA_markov
}, {
    id: 'B_ngram',
    fn: algoB_ngram
}, {
    id: 'C_entropy',
    fn: algoC_entropy
}, {
    id: 'D_dice',
    fn: algoD_dicePattern
}, {
    id: 'E_runmom',
    fn: algoE_runMomentum
}, {
    id: 'F_window',
    fn: algoF_windowSimilarity
}, {
    id: 'G_fibonacci',
    fn: algoG_fibonacciPattern
}, {
    id: 'H_diceTotal',
    fn: algoH_lastDiceTotal
}, {
    id: 'I_runDist',
    fn: algoI_runLengthDistribution
}, {
    id: 'J_anomalies',
    fn: algoJ_statisticalAnomalies
}, {
    id: 'K_NgramPlus',
    fn: algoK_NgramPlus
}, {
    id: 'L_PatternMatchingDynamic',
    fn: algoL_PatternMatchingDynamic
}, {
    id: 'M_RecentBias',
    fn: algoM_RecentBias
}, {
    id: 'N_MartingaleReversal',
    fn: algoN_MartingaleReversal
}, {
    id: 'O_AdaptiveNgram', // SIÊU THUẬT TOÁN MỚI 1
    fn: algoO_AdaptiveNgram
}, {
    id: 'P_MeanReversion', // SIÊU THUẬT TOÁN MỚI 2
    fn: algoP_MeanReversion
}, {
    id: 'Q_SymmetryReversal', // SIÊU THUẬT TOÁN MỚI 3
    fn: algoQ_SymmetryReversal
}, {
    id: 'R_Persistence', // SIÊU THUẬT TOÁN MỚI 4
    fn: algoR_StatisticalPersistence
}];

// ================= MANAGER =================
class SEIUManager {
    constructor(opts = {}) {
        this.history = [];
        this.ensemble = new SEIUEnsemble(ALL_ALGS, {
            emaAlpha: opts.emaAlpha ?? 0.1, // Cập nhật alpha
            historyWindow: opts.historyWindow ?? 500
        });
        this.warm = false;
        this.currentPrediction = null;
    }

    loadInitial(lines) {
        this.history = parseLines(lines);
        this.ensemble.fitInitial(this.history);
        this.warm = true;

        this.currentPrediction = this.getPrediction();

        console.log("📦 Đã tải lịch sử các phiên gần nhất. Hệ thống đã sẵn sàng dự đoán.");
        const nextSession = this.history.at(-1) ? this.history.at(-1).session + 1 : 'N/A';
        console.log(`🔮 Dự đoán phiên tiếp theo (${nextSession}): ${this.currentPrediction.prediction} (Tỷ lệ: ${(this.currentPrediction.confidence * 100).toFixed(0)}%)`);
    }

    pushRecord(record) {
        const parsed = {
            session: record.session,
            dice: record.dice,
            total: record.total,
            result: record.result,
            tx: record.total >= 11 ? 'T' : 'X'
        };

        // So sánh dự đoán CỦA PHIÊN CŨ với kết quả mới nhất
        if (this.currentPrediction) {
            const actualResult = parsed.tx;
            const predictionText = this.currentPrediction.rawPrediction === 'T' ? 'Tài' : 'Xỉu';

            if (this.currentPrediction.rawPrediction === actualResult) {
                predictionStats.totalCorrect++;
                console.log(`✅ Phiên ${parsed.session}: ĐÚNG (${predictionText} - ${actualResult}). Tỷ lệ: ${(predictionStats.totalCorrect / (predictionStats.totalCorrect + predictionStats.totalIncorrect) * 100).toFixed(2)}%`);
            } else {
                predictionStats.totalIncorrect++;
                console.log(`❌ Phiên ${parsed.session}: SAI (${predictionText} - ${actualResult}). Tỷ lệ: ${(predictionStats.totalCorrect / (predictionStats.totalCorrect + predictionStats.totalIncorrect) * 100).toFixed(2)}%`);
            }
        }

        // Cập nhật trọng số (dùng lịch sử trước khi thêm phiên mới)
        const prefix = this.history.slice();
        if (prefix.length >= 3) {
            this.ensemble.updateWithOutcome(prefix, parsed.tx);
        }

        // Thêm phiên mới vào lịch sử
        this.history.push(parsed);

        // Dự đoán cho phiên TIẾP THEO
        this.currentPrediction = this.getPrediction();
        console.log(`📥 Phiên mới ${parsed.session} → ${parsed.result}. Dự đoán phiên ${parsed.session + 1} là: ${this.currentPrediction.prediction} (Tỷ lệ: ${(this.currentPrediction.confidence * 100).toFixed(0)}%)`);
    }

    getPrediction() {
        return this.ensemble.predict(this.history);
    }
}

const seiuManager = new SEIUManager();

// ================= HELPER & WEBSOCKET (Giữ nguyên) =================
function decodeBinaryMessage(data) {
    try {
        const message = new TextDecoder().decode(data);
        if (message.startsWith("[") || message.startsWith("{")) {
            return JSON.parse(message);
        }
        return null;
    } catch {
        return null;
    }
}

function sendRikCmd1005() {
    if (rikWS?.readyState === WebSocket.OPEN) {
        rikWS.send(JSON.stringify([6, "MiniGame", "taixiuPlugin", {
            cmd: 1005
        }]));
    }
}

function connectRikWebSocket() {
    console.log("🔌 Đang kết nối đến WebSocket...");
    rikWS = new WebSocket(`${WS_URL}${TOKEN}`);

    rikWS.on("open", () => {
        const authPayload = [
            1,
            "MiniGame",
            "SC_hellokietne212",
            "kiet2012", {
                info: JSON.stringify({
                    ipAddress: "2402:800:62cd:b4d1:8c64:a3c9:12bf:c19a",
                    wsToken: TOKEN,
                    userId: "cdbaf598-e4ef-47f8-b4a6-a4881098db86",
                    username: "SC_hellokietne212",
                    timestamp: Date.now(),
                }),
                signature:
                    "473ABDDDA6BDD74D8F0B6036223B0E3A002A518203A9BB9F95AD763E3BF969EC2CBBA61ED1A3A9E217B52A4055658D7BEA38F89B806285974C7F3F62A9400066709B4746585887D00C9796552671894F826E69EFD234F6778A5DDC24830CEF68D51217EF047644E0B0EB1CB26942EB34AEF114AEC36A6DF833BB10F7D122EA5E",
                pid: 5,
                subi: true,
            },
        ];
        rikWS.send(JSON.stringify(authPayload));
        clearInterval(rikIntervalCmd);
        rikIntervalCmd = setInterval(sendRikCmd1005, 5000);
    });

    rikWS.on("message", (data) => {
        try {
            const json =
                typeof data === "string" ? JSON.parse(data) : decodeBinaryMessage(data);
            if (!json) return;

            if (
                typeof json === "object" &&
                json !== null &&
                json.session &&
                Array.isArray(json.dice)
            ) {
                const record = {
                    session: json.session,
                    dice: json.dice,
                    total: json.total,
                    result: json.result,
                };
                // PHIÊN MỚI
                seiuManager.pushRecord(record);
                if (!rikCurrentSession || record.session > rikCurrentSession) {
                    rikCurrentSession = record.session;
                    rikResults.unshift(record);
                    if (rikResults.length > 200) rikResults.pop();
                }
            } else if (Array.isArray(json) && json[1]?.htr) {
                const newHistory = json[1].htr
                    .map((i) => ({
                        session: i.sid,
                        dice: [i.d1, i.d2, i.d3],
                        total: i.d1 + i.d2 + i.d3,
                        result: i.d1 + i.d2 + i.d3 >= 11 ? "Tài" : "Xỉu",
                    }))
                    .sort((a, b) => b.session - a.session);
                // TẢI LỊCH SỬ BAN ĐẦU
                seiuManager.loadInitial(newHistory);
                rikResults = newHistory.slice(0, 200);
            }
        } catch (e) {
            console.error("❌ Parse error:", e.message);
        }
    });

    rikWS.on("close", () => {
        console.log("🔌 WebSocket ngắt kết nối. Đang kết nối lại...");
        clearInterval(rikIntervalCmd); // Dọn dẹp interval cũ
        setTimeout(connectRikWebSocket, 5000);
    });

    rikWS.on("error", (err) => {
        console.error("🔌 WebSocket error:", err.message);
        rikWS.close();
    });
}

connectRikWebSocket();

// ================= API (Nâng cấp tên trường) =================
