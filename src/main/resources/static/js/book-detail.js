const isbn13 = document.getElementById('isbn13Hidden')?.value || "";
let allComments = [];
let currentWritePage = 1;

async function loadDetail() {
    try {
        const res = await fetch(`/api/books/${isbn13}`);
        if (!res.ok) return;
        const b = await res.json();
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
        document.getElementById('currentPage').textContent = data.currentPage ?? 0;
    } catch (e) {
        console.error(e);
    }
}

async function saveProgress() {
    const v = document.getElementById('progressInput').value;
    const n = Number(v);
    if (Number.isNaN(n) || n < 0) return alert('0 이상 숫자를 입력하세요.');
    try {
        const res = await fetch(`/api/books/${isbn13}/progress`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPage: n })
        });
        if (!res.ok) {
            alert('저장 실패: ' + res.status);
            return;
        }
        await loadProgress();
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
        const res = await fetch(`/api/books/${isbn13}/reviews`);
        if (!res.ok) {
            container.textContent = '리뷰를 불러오지 못했습니다.';
            return;
        }
        const data = await res.json();

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

        reviews.forEach((r, idx) => {
            const item = document.createElement('div');
            item.className = 'review-item';

            const meta = document.createElement('div');
            meta.className = 'review-meta';

            const dateStr = r.createdAt
                ? new Date(r.createdAt).toLocaleString('ko-KR')
                : '';

            // 여기 추가: 각 리뷰의 별점 표시용 텍스트
            const ratingPart =
                (typeof r.rating === 'number')
                    ? ` • ★ ${r.rating}`
                    : '';

            // meta.textContent 수정: ratingPart를 끼워넣음
            meta.textContent =
                `${idx === 0 ? '최근 리뷰' : `리뷰 #${reviews.length - idx}`} ` +
                (dateStr ? `• ${dateStr}` : '') +
                ratingPart +
                (r.spoiler ? ' • 스포일러 포함' : '');

            const body = document.createElement('div');
            body.className = 'review-body';

            if (r.spoiler) {
                // 기본은 내용 숨기고 안내 문구 + 버튼
                const placeholder = document.createElement('div');
                placeholder.textContent = '스포일러가 포함된 리뷰입니다. "보기" 버튼을 눌러 내용을 확인하세요.';

                const real = document.createElement('div');
                real.textContent = r.overall;
                real.style.display = 'none';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = '스포일러 보기';
                btn.addEventListener('click', () => {
                    const isHidden = real.style.display === 'none';
                    real.style.display = isHidden ? 'block' : 'none';
                    btn.textContent = isHidden ? '스포일러 숨기기' : '스포일러 보기';
                });

                body.appendChild(placeholder);
                body.appendChild(real);
                body.appendChild(btn);
            } else {
                body.textContent = r.overall;
            }

            item.appendChild(meta);
            item.appendChild(body);
            container.appendChild(item);
        });
    } catch (e) {
        console.error(e);
        container.textContent = '리뷰를 불러오는 중 오류가 발생했습니다.';
        const avgSpan = document.getElementById('reviewAverage');
        if (avgSpan) avgSpan.textContent = '';
    }
}

async function saveReview() {
    const text    = document.getElementById('reviewText').value.trim();
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
        const res = await fetch(`/api/books/${isbn13}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                overall: text,
                spoiler: spoiler,
                rating: rating
            })
        });
        if (!res.ok) {
            alert('리뷰 저장 실패: ' + res.status);
            return;
        }
        document.getElementById('reviewText').value = '';
        document.getElementById('reviewSpoiler').checked = false;
        document.getElementById('reviewRating').value = ''; // 평점 입력창도 초기화
        await loadReviews();   // 저장 후 전체 목록 다시 로딩
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// ===== 모달용 공통 =====
function updateModalPageInfo() {
    const info = document.getElementById('modalPageInfo');
    info.textContent = `현재 작성 대상 페이지: p.${currentWritePage}`;
}

function renderModalComments() {
    const listEl = document.getElementById('modalCommentList');
    const fromEl = document.getElementById('filterFrom');
    const toEl   = document.getElementById('filterTo');
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
    const toVal   = Number(toEl.value);
    const hasFrom = !Number.isNaN(fromVal) && fromVal >= 1;
    const hasTo   = !Number.isNaN(toVal)   && toVal   >= 1;

    if (hasFrom) list = list.filter(c => c.page >= fromVal);
    if (hasTo)   list = list.filter(c => c.page <= toVal);

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
        meta.textContent = `p.${c.page}`;

        const body = document.createElement('div');
        body.textContent = c.comment;

        li.appendChild(meta);
        li.appendChild(body);
        listEl.appendChild(li);
    });
}

async function fetchAllComments() {
    try {
        const res = await fetch(`/api/books/${isbn13}/page-comments`);
        if (!res.ok) {
            allComments = [];
            return;
        }
        const data = await res.json();
        allComments = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error(e);
        allComments = [];
    }
}

async function reloadModalComments() {
    await fetchAllComments();
    renderModalComments();
}

function openCommentModal() {
    // 기본 페이지: 빠른 입력란 > 진행도 > 1
    const quickPage = Number(document.getElementById('quickCommentPage').value);
    const currentPage = Number(document.getElementById('currentPage').textContent);

    if (!Number.isNaN(quickPage) && quickPage >= 1) {
        currentWritePage = quickPage;
    } else if (!Number.isNaN(currentPage) && currentPage >= 1) {
        currentWritePage = currentPage;
    } else {
        currentWritePage = 1;
    }

    document.getElementById('modalCommentPage').value = currentWritePage;
    updateModalPageInfo();

    document.getElementById('commentModal').classList.remove('hidden');
    reloadModalComments();
}

function closeCommentModal() {
    document.getElementById('commentModal').classList.add('hidden');
}

async function addCommentFromModal() {
    const pageInput = document.getElementById('modalCommentPage');
    const textEl    = document.getElementById('modalCommentText');

    const page = Number(pageInput.value);
    const text = textEl.value.trim();

    if (Number.isNaN(page) || page < 1 || !text) {
        alert('페이지(>=1)와 코멘트를 입력하세요.');
        return;
    }

    try {
        const res = await fetch(`/api/books/${isbn13}/page-comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: page, comment: text })
        });
        if (!res.ok) {
            alert('코멘트 저장 실패: ' + res.status);
            return;
        }
        textEl.value = '';
        currentWritePage = page;
        document.getElementById('modalCommentPage').value = currentWritePage;
        updateModalPageInfo();
        await reloadModalComments();
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// ===== 빠른 입력용 =====
async function addQuickComment() {
    const pageInput = document.getElementById('quickCommentPage');
    const textEl    = document.getElementById('quickCommentText');

    const page = Number(pageInput.value);
    const text = textEl.value.trim();

    if (Number.isNaN(page) || page < 1 || !text) {
        alert('페이지(>=1)와 코멘트를 입력하세요.');
        return;
    }

    try {
        const res = await fetch(`/api/books/${isbn13}/page-comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: page, comment: text })
        });
        if (!res.ok) {
            alert('코멘트 저장 실패: ' + res.status);
            return;
        }
        textEl.value = '';
        pageInput.value = '';
        // 모달이 열려 있다면 리스트 갱신
        if (!document.getElementById('commentModal').classList.contains('hidden')) {
            await reloadModalComments();
        }
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// ===== 이벤트 바인딩 =====
document.getElementById('progressBtn').addEventListener('click', saveProgress);

document.getElementById('openCommentModalBtn').addEventListener('click', openCommentModal);
document.getElementById('closeCommentModalBtn').addEventListener('click', closeCommentModal);
document.querySelector('#commentModal .modal-backdrop')
    .addEventListener('click', closeCommentModal);

document.getElementById('modalAddCommentBtn').addEventListener('click', addCommentFromModal);

document.getElementById('applyFilterBtn').addEventListener('click', renderModalComments);
document.getElementById('resetFilterBtn').addEventListener('click', () => {
    document.getElementById('filterFrom').value = '';
    document.getElementById('filterTo').value   = '';
    document.getElementById('sortOrder').value  = 'asc';
    renderModalComments();
});

document.getElementById('modalCommentPage').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v) && v >= 1) {
        currentWritePage = v;
        updateModalPageInfo();
    }
});

document.getElementById('quickCommentBtn').addEventListener('click', addQuickComment);

// 초기 로딩
loadDetail();
loadProgress();
loadReviews();
