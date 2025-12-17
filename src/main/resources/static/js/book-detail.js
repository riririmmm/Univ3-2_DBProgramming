const isbn13 = document.getElementById('isbn13Hidden')?.value || "";
let allComments = [];
let currentWritePage = 1;
let bookPageCount = null;

async function fetchWithLoginConfirm(url, options = {}) {
    let res;
    try {
        res = await fetch(url, {
            ...options,
            redirect: "manual" // 302 따라가지 말기 (무한 redirect 방지)
        });
    } catch (e) {
        // 네트워크 레벨 오류(예: too many redirects로 fetch 자체가 실패)
        const ok = confirm("로그인이 필요한 기능입니다 로그인 화면으로 이동하시겠습니까?");
        if (ok) {
            const next = encodeURIComponent(buildNext());
            location.href = `/login?next=${next}`;
        }
        return null;
    }

    // 401이면 기존대로
    if (res.status === 401) {
        const ok = confirm("로그인이 필요한 기능입니다 로그인 화면으로 이동하시겠습니까?");
        if (ok) {
            const next = encodeURIComponent(buildNext());
            location.href = `/login?next=${next}`;
        }
        return null;
    }

    // 302/303/307/308 같은 리다이렉트도 로그인 필요로 처리
    if ((res.status >= 300 && res.status < 400) || res.type === "opaqueredirect") {
        const ok = confirm("로그인이 필요한 기능입니다 로그인 화면으로 이동하시겠습니까?");
        if (ok) {
            const next = encodeURIComponent(buildNext());
            location.href = `/login?next=${next}`;
        }
        return null;
    }

    return res;
}

function buildNext() {
    const path = location.pathname;

    // 정상적인 페이지에서만 next 허용
    if (!path.startsWith("/books")) {
        return "/";   // 기본 복귀
    }

    const params = new URLSearchParams(location.search);
    params.delete("continue"); // continue 제거

    const qs = params.toString();
    return path + (qs ? `?${qs}` : "");
}

// 상세/진행도
async function loadDetail() {
    try {
        const res = await fetch(`/api/books/${isbn13}`);
        if (!res.ok) return;
        const b = await res.json();
        bookPageCount = Number(b.pageCount ?? 0);
        document.getElementById('title').textContent = b.title;
        document.getElementById('meta').textContent =
            (b.authors && b.authors.length ? b.authors.join(', ') : '') +
            ' | ' + (b.publisher || '');
        document.getElementById('pages').textContent = b.pageCount ? `${b.pageCount}쪽` : '';
        document.getElementById('desc').textContent = b.description || '';
        const cover = document.getElementById('cover');
        cover.src = b.coverUrl || '';
        cover.alt = b.title;
    } catch (e) {
        console.error(e);
    }
}

async function loadProgress() {
    try {
        const res = await fetch(`/api/books/${isbn13}/progress`);
        if (!res.ok) return;
        const data = await res.json();
        const current = data.currentPage ?? 0;
        document.getElementById('currentPage').textContent = current;

        // 퍼센트 계산
        const percentEl = document.getElementById('progressPercent');
        if (percentEl && bookPageCount && bookPageCount > 0) {
            const pct = Math.min(100, Math.round((current / bookPageCount) * 100));
            percentEl.textContent = ` (${pct}%)`;
        } else if (percentEl) {
            percentEl.textContent = '';
        }
    } catch (e) {
        console.error(e);
    }
}

// 진행도 저장
async function saveProgress() {
    const v = document.getElementById('progressInput').value;
    const n = Number(v);
    if (Number.isNaN(n) || n < 0) return alert('0 이상 숫자를 입력하세요.');
    try {
        const res = await fetchWithLoginConfirm(`/api/books/${isbn13}/progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPage: n })
        });
        if (!res) return;
        if (!res.ok) {
            alert('저장 실패: ' + res.status);
            return;
        }
        await loadProgress();

        // 진행도 저장 후: 모달 열려있으면(또는 다음 열 때) 기본 필터도 갱신되도록
        if (!document.getElementById('commentModal').classList.contains('hidden')) {
            await reloadModalComments();
        }
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// ===== 여러 개의 리뷰 로딩 =====
async function loadReviews() {
    const container = document.getElementById('reviewList');
    container.innerHTML = '';

    try {
        const res = await fetch(`/api/books/${isbn13}/review`);
        if (!res.ok) {
            container.textContent = '리뷰를 불러오지 못했습니다.';
            return;
        }
        const data = await res.json();

        console.log("review sample:", data?.[0] ?? data);

        const reviews = Array.isArray(data)
            ? data
            : (data ? [data] : []);

        const avgSpan = document.getElementById('reviewAverage');

        if (reviews.length === 0) {
            container.textContent = '아직 등록된 리뷰가 없습니다.';
            if (avgSpan) avgSpan.textContent = '';   // 평균 표시 제거
            return;
        }

        // 평점 평균 계산
        let ratingSum = 0;
        let ratingCount = 0;
        reviews.forEach(r => {
            if (typeof r.rating === 'number') {
                ratingSum += r.rating;
                ratingCount++;
            }
        });

        if (avgSpan) {
            if (ratingCount > 0) {
                const avg = ratingSum / ratingCount;
                avgSpan.textContent = `평균 ★ ${avg.toFixed(1)} (${ratingCount}명)`;
            } else {
                avgSpan.textContent = '';
            }
        }

        // 최신 작성일 순 정렬
        reviews.sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
        });

        reviews.forEach((r) => {
            const item = document.createElement('div');
            item.className = 'review-item';

            const meta = document.createElement('div');
            meta.className = 'review-meta';

            const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleString('ko-KR') : '';
            const ratingText = (typeof r.rating === 'number') ? `★ ${r.rating}` : '';
            const nick = r['authorNickname'] ? r['authorNickname'] : '익명';

            meta.textContent =
                `${nick}` +
                (ratingText ? ` | ${ratingText}` : '') +
                (dateStr ? ` | ${dateStr}` : '') +
                (r.spoiler ? ' | 스포일러' : '');

            const body = document.createElement('div');
            body.className = 'review-body';
            body.textContent = r.overall;

            item.appendChild(meta);
            item.appendChild(body);

            // 스포일러면 블러 + 버튼
            if (r.spoiler) {
                body.classList.add('spoiler-masked');

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'spoiler-toggle';
                btn.textContent = '보기';

                btn.addEventListener('click', () => {
                    const masked = body.classList.toggle('spoiler-masked');
                    btn.textContent = masked ? '보기' : '숨기기';
                });

                item.appendChild(btn);
            }

            container.appendChild(item);
        });
    } catch (e) {
        console.error(e);
        container.textContent = '리뷰를 불러오는 중 오류가 발생했습니다.';
        const avgSpan = document.getElementById('reviewAverage');
        if (avgSpan) avgSpan.textContent = '';
    }
}

// 리뷰 저장
async function saveReview() {
    const text = document.getElementById('reviewText').value.trim();
    const spoiler = document.getElementById('reviewSpoiler').checked;
    const ratingStr = document.getElementById('reviewRating').value;
    const rating = parseFloat(ratingStr);

    if (!text) {
        return alert('리뷰 내용을 입력하세요.');
    }

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
        return alert('평점은 1에서 5 사이의 숫자여야 합니다.');
    }

    try {
        const res = await fetchWithLoginConfirm(`/api/books/${isbn13}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                overall: text,
                spoiler: spoiler,
                rating: rating
            })
        });
        if (!res) return;
        if (!res.ok) {
            alert('리뷰 저장 실패: ' + res.status);
            return;
        }
        document.getElementById('reviewText').value = '';
        document.getElementById('reviewSpoiler').checked = false;
        document.getElementById('reviewRating').value = '';     // 평점 입력창도 초기화
        await loadReviews();    // 저장 후 전체 목록 다시 로딩
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// 코멘트 모달
function updateModalPageInfo() {
    const info = document.getElementById('modalPageInfo');
    info.textContent = `현재 작성 대상 페이지: p.${currentWritePage}`;
}

function renderModalComments() {
    const listEl = document.getElementById('modalCommentList');
    const fromEl = document.getElementById('filterFrom');
    const toEl = document.getElementById('filterTo');
    const sortEl = document.getElementById('sortOrder');

    listEl.innerHTML = '';

    if (!allComments || allComments.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'comment-list-empty';
        empty.textContent = '등록된 코멘트가 없습니다.';
        listEl.appendChild(empty);
        return;
    }

    let list = allComments.slice();

    const fromVal = Number(fromEl.value);
    const toVal = Number(toEl.value);
    const hasFrom = !Number.isNaN(fromVal) && fromVal >= 0;
    const hasTo = !Number.isNaN(toVal) && toVal >= 0;

    if (hasFrom) list = list.filter(c => c.page >= fromVal);
    if (hasTo) list = list.filter(c => c.page <= toVal);

    if (sortEl.value === 'asc') {
        list.sort((a, b) => a.page - b.page);
    } else {
        list.sort((a, b) => b.page - a.page);
    }

    if (list.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'comment-list-empty';
        empty.textContent = '해당 조건에 맞는 코멘트가 없습니다.';
        listEl.appendChild(empty);
        return;
    }

    list.forEach(c => {
        const li = document.createElement('li');
        li.className = 'comment-item';

        const meta = document.createElement('div');
        meta.className = 'comment-meta';
        const nick = c['authorNickname'] ? c['authorNickname'] : '익명';

        const dateStr = c.createdAt
            ? new Date(String(c.createdAt)).toLocaleString('ko-KR')
            : '';

        meta.textContent = `${nick} | p.${c.page}` + (dateStr ? ` | ${dateStr}` : '');

        const body = document.createElement('div');
        body.textContent = c.comment;

        li.appendChild(meta);
        li.appendChild(body);
        listEl.appendChild(li);
    });
}

/**
 * 서버에서 코멘트를 가져올 때 upto를 서버에 넘김
 * - upto가 null이면: 서버 기본값(진행도 currentPage까지)
 * - upto가 숫자면: ?upto= 로 지정한 범위까지
 * 응답은 { upto, items } 형태를 가정
 */
async function fetchAllComments(upto = null) {
    try {
        const url = (upto === null)
            ? `/api/books/${isbn13}/page-comments`
            : `/api/books/${isbn13}/page-comments?upto=${encodeURIComponent(upto)}`;

        const res = await fetch(url);
        if (!res.ok) {
            console.error("page-comments fetch failed:", res.status, await res.text());
            allComments = [];
            return;
        }

        const data = await res.json(); // { upto, items }
        allComments = Array.isArray(data.items) ? data.items : [];

        const effectiveUpto = (data.upto ?? 0);

        // 현재 필터링 페이지 표시
        const infoEl = document.getElementById('currentFilterInfo');
        if (infoEl) infoEl.textContent = `현재 표시: 0 ~ ${effectiveUpto} 페이지`;

        // 기본 필터값은 "무조건" 0~effectiveUpto로 맞춰줌 (빈칸일 때만 X)
        const fromEl = document.getElementById('filterFrom');
        const toEl = document.getElementById('filterTo');
        if (fromEl && fromEl.value.trim() === '') fromEl.value = 0;
        if (toEl && toEl.value.trim() === '') toEl.value = effectiveUpto;

    } catch (e) {
        console.error(e);
        allComments = [];
    }
}

/**
 * 모달의 "현재 to 값"을 기준으로 서버에서 다시 가져와서 렌더
 * - 적용 버튼 누르면 서버 재조회
 * - 모달 열 때도 서버 재조회
 */
async function reloadModalComments() {
    const toEl = document.getElementById('filterTo');
    const toVal = Number(toEl?.value);

    const upto = (!Number.isNaN(toVal) && toVal >= 0) ? toVal : null;

    await fetchAllComments(upto);
    renderModalComments();
}

function openCommentModal() {
    // 기본 페이지: 빠른 입력란 > 진행도 > 1
    const quickPage = Number(document.getElementById('quickCommentPage').value);
    const currentPage = Number(document.getElementById('currentPage').textContent);

    if (!Number.isNaN(quickPage) && quickPage >= 0) {
        currentWritePage = quickPage;
    } else if (!Number.isNaN(currentPage) && currentPage >= 0) {
        currentWritePage = currentPage;
    } else {
        currentWritePage = 0;
    }

    document.getElementById('modalCommentPage').value = currentWritePage;
    updateModalPageInfo();

    document.getElementById('commentModal').classList.remove('hidden');

    // 모달 열면: 먼저 진행도/기본 범위로 가져오게 하려면 null로
    // (서버가 진행도 기반 기본 필터를 적용하도록)
    fetchAllComments(null).then(() => renderModalComments());
}

function closeCommentModal() {
    document.getElementById('commentModal').classList.add('hidden');
}

async function addCommentFromModal() {
    const pageInput = document.getElementById('modalCommentPage');
    const textEl = document.getElementById('modalCommentText');

    const page = Number(pageInput.value);
    const text = textEl.value.trim();

    if (Number.isNaN(page) || page < 0 || !text) {
        alert('페이지(>=0)와 코멘트를 입력하세요.');
        return;
    }

    try {
        const res = await fetchWithLoginConfirm(`/api/books/${isbn13}/page-comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: page, comment: text })
        });
        if (!res) return;
        if (!res.ok) {
            alert('코멘트 저장 실패: ' + res.status);
            return;
        }
        textEl.value = '';
        currentWritePage = page;
        document.getElementById('modalCommentPage').value = currentWritePage;
        updateModalPageInfo();

        // 저장 후에는 현재 필터(to) 기준으로 다시 불러오기
        await reloadModalComments();
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// ===== 빠른 입력용 =====
async function addQuickComment() {
    const pageInput = document.getElementById('quickCommentPage');
    const textEl = document.getElementById('quickCommentText');

    const page = Number(pageInput.value);
    const text = textEl.value.trim();

    if (Number.isNaN(page) || page < 0 || !text) {
        alert('페이지(>=0)와 코멘트를 입력하세요.');
        return;
    }

    try {
        const res = await fetchWithLoginConfirm(`/api/books/${isbn13}/page-comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: page, comment: text })
        });
        if (!res) return;
        if (!res.ok) {
            alert('코멘트 저장 실패: ' + res.status);
            return;
        }
        textEl.value = '';
        pageInput.value = '';

        if (!document.getElementById('commentModal').classList.contains('hidden')) {
            await reloadModalComments();
        }
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// 이벤트 바인딩
document.getElementById('progressBtn').addEventListener('click', saveProgress);

document.getElementById('openCommentModalBtn').addEventListener('click', openCommentModal);
document.getElementById('closeCommentModalBtn').addEventListener('click', closeCommentModal);
document.querySelector('#commentModal .modal-backdrop')
    .addEventListener('click', closeCommentModal);

document.getElementById('modalAddCommentBtn').addEventListener('click', addCommentFromModal);

// 적용 버튼
document.getElementById('applyFilterBtn').addEventListener('click', reloadModalComments);

// 초기화: 0~(현재 진행도 기반)로 다시 가져와서 렌더
document.getElementById('resetFilterBtn').addEventListener('click', async () => {
    document.getElementById('sortOrder').value = 'asc';
    await fetchAllComments(null); // 서버 기본값(진행도) 사용
    renderModalComments();
});

document.getElementById('modalCommentPage').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v) && v >= 0) {
        currentWritePage = v;
        updateModalPageInfo();
    }
});

document.getElementById('quickCommentBtn').addEventListener('click', addQuickComment);

// 초기 로딩
(async () => {
    await loadDetail();
    await loadProgress();
    loadReviews();
})();
