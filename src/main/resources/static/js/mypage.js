document.addEventListener("DOMContentLoaded", () => {
    // 모달 닫기 버튼
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    // 모달 배경 클릭 시 닫기
    const backdrop = document.getElementById("review-modal-backdrop");
    if (backdrop) {
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) closeModal();
        });
    }

    // 페이지 진입 시 내 책 목록 로드
    loadMyBooks();
});

/**
 * 내가 리뷰 or 코멘트 남긴 책 목록 로드
 * - 리뷰 기반 책 + 코멘트 기반 책을 합쳐서
 * - isbn13 기준으로 중복 제거
 */
async function loadMyBooks() {
    const container = document.getElementById("my-books");
    container.innerHTML = "";

    // 리뷰 책 목록 + 코멘트 책 목록 동시에 요청
    const [reviewRes, commentRes, progressRes] = await Promise.all([
        fetch("/api/me/books"),
        fetch("/api/me/page-comments"),
        fetch("/api/me/progress")
    ]);

    const reviewBooks = reviewRes.ok ? await reviewRes.json() : [];
    const commentBooks = commentRes.ok ? await commentRes.json() : [];
    const progressBooks = progressRes.ok ? await progressRes.json() : [];

    // isbn13 기준 중복 제거 + progress(currentPage) 보관
    const map = new Map();

    // 리뷰/코멘트 쪽은 isbn13만 있으면 됨
    [...reviewBooks, ...commentBooks].forEach((b) => {
        if (b?.isbn13 && !map.has(b.isbn13)) map.set(b.isbn13, {isbn13: b.isbn13});
    });

    // progress는 currentPage까지 저장
    progressBooks.forEach((p) => {
        if (!p?.isbn13) return;
        const prev = map.get(p.isbn13) || {isbn13: p.isbn13};
        prev.currentPage = p.currentPage ?? 0;
        map.set(p.isbn13, prev);
    });

    const books = [...map.values()];

    if (books.length === 0) {
        container.innerHTML = "<li>진행도/리뷰/코멘트를 남긴 책이 아직 없습니다.</li>";
        return;
    }

    // 카드 렌더링
    for (const b of books) {
        const li = document.createElement("li");
        li.className = "book-card";

        try {
            // 책 상세 정보 조회 (제목 / 표지 / pageCount)
            const detailRes = await fetch(`/api/books/${b.isbn13}`);
            if (!detailRes.ok) continue;
            const book = await detailRes.json();

            const img = document.createElement("img");
            img.className = "book-cover";
            img.src = book.coverUrl || "";
            img.alt = book.title || "";

            const titleDiv = document.createElement("div");
            titleDiv.className = "book-title";
            titleDiv.textContent = book.title || b.isbn13;

            li.appendChild(img);
            li.appendChild(titleDiv);

            // 진행도 표시
            if (b.currentPage != null) {
                const progressDiv = document.createElement("div");
                progressDiv.className = "book-progress";

                const pageCount = book.pageCount; // detail API에서 내려오는 값 (BookView.pageCount)
                const current = b.currentPage;

                if (pageCount) {
                    const pct = Math.max(0, Math.min(100, Math.round((current / pageCount) * 100)));
                    progressDiv.textContent = `진행도 ${pct}% (${current}/${pageCount}쪽)`;
                } else {
                    progressDiv.textContent = `현재 ${current}쪽`;
                }

                li.appendChild(progressDiv);
            }

            // 카드 클릭 → 모달 열기
            li.addEventListener("click", () =>
                openBookModal(b.isbn13, book.title || b.isbn13)
            );

            container.appendChild(li);
        } catch (e) {
            console.error("책 상세 조회 실패", e);
        }
    }
}

/**
 * 책 클릭 시 모달 열기
 * - 해당 책에 대해 내가 쓴 리뷰 + 페이지 코멘트 조회
 */
async function openBookModal(isbn13, title) {
    const backdrop = document.getElementById("review-modal-backdrop");
    const titleEl = document.getElementById("modal-book-title");
    const linkEl = document.getElementById("modal-book-link");
    const reviewEl = document.getElementById("modal-reviews");
    const commentEl = document.getElementById("modal-comments");

    titleEl.textContent = title;
    linkEl.innerHTML = `<a href="/books/${isbn13}">도서 상세 페이지로 이동</a>`;

    reviewEl.textContent = "리뷰를 불러오는 중...";
    commentEl.textContent = "코멘트를 불러오는 중...";

    // 리뷰 / 코멘트 동시에 요청
    const [reviewRes, commentRes] = await Promise.all([
        fetch(`/api/me/books/${isbn13}/reviews`),
        fetch(`/api/me/books/${isbn13}/page-comments`),
    ]);

    /* ===== 리뷰 렌더링 ===== */
    if (!reviewRes.ok) {
        reviewEl.textContent = "리뷰를 불러오지 못했습니다.";
    } else {
        const reviews = await reviewRes.json();
        if (reviews.length === 0) {
            reviewEl.textContent = "이 책에 남긴 리뷰가 없습니다.";
        } else {
            reviewEl.innerHTML = "";
            for (const r of reviews) {
                reviewEl.appendChild(
                    createItem({
                        meta: `평점: ${r.rating ?? "-"} | 스포일러: ${
                            r.spoiler ? "O" : "X"
                        } | 작성일: ${r.createdAt ?? ""}`,
                        body: r.overall,
                        editAction: "edit-review",
                        deleteAction: "delete-review",
                        id: r.id,

                        // 인라인 편집에 필요
                        rating: r.rating ?? null,     // Double
                        spoiler: !!r.spoiler,
                    })
                );
            }
        }
    }

    /* ===== 코멘트 렌더링 ===== */
    if (!commentRes.ok) {
        commentEl.textContent = "코멘트를 불러오지 못했습니다.";
    } else {
        const comments = await commentRes.json();
        if (comments.length === 0) {
            commentEl.textContent = "이 책에 남긴 코멘트가 없습니다.";
        } else {
            commentEl.innerHTML = "";
            for (const c of comments) {
                commentEl.appendChild(
                    createItem({
                        meta: `p.${c.page} | 작성일: ${c.createdAt ?? ""}`,
                        body: c.comment,
                        editAction: "edit-comment",
                        deleteAction: "delete-comment",
                        id: c.id,
                    })
                );
            }
        }
    }

    backdrop.classList.add("show");
}

// 공통 아이템(리뷰/코멘트) DOM 생성
// 리뷰는 rating/spoiler를 dataset에 저장해 인라인 편집에 사용
function createItem({meta, body, editAction, deleteAction, id, rating, spoiler}) {
    const wrapper = document.createElement("div");
    wrapper.className = "modal-review-item";

    // 리뷰일 때만 dataset 저장
    if (editAction === "edit-review") {
        wrapper.dataset.rating = rating ?? "";
        wrapper.dataset.spoiler = spoiler ? "true" : "false";
    }

    const head = document.createElement("div");
    head.className = "item-head";

    const metaDiv = document.createElement("div");
    metaDiv.className = "modal-review-meta";
    metaDiv.textContent = meta;

    const menu = document.createElement("div");
    menu.className = "menu";
    menu.innerHTML = `
        <button class="kebab" type="button" aria-label="menu">⋯</button>
        <div class="menu-panel">
            <button class="menu-item" type="button" data-action="${editAction}" data-id="${id}">수정하기</button>
            <button class="menu-item danger" type="button" data-action="${deleteAction}" data-id="${id}">삭제하기</button>
        </div>
    `;

    head.appendChild(metaDiv);
    head.appendChild(menu);

    const bodyDiv = document.createElement("div");
    bodyDiv.className = "item-body";
    bodyDiv.textContent = body;

    wrapper.appendChild(head);
    wrapper.appendChild(bodyDiv);
    return wrapper;
}

/**
 * 메뉴(⋯) / 수정 / 삭제 이벤트 위임
 * - 수정/삭제 후 location.reload() 안 함
 * - 모달 안 닫힘
 * - DOM에서 바로 반영
 */
document.addEventListener("click", async (e) => {
    // 1) ⋯ 버튼 클릭
    const kebab = e.target.closest(".kebab");
    if (kebab) {
        closeAllMenus();
        const panel = kebab.parentElement.querySelector(".menu-panel");
        panel?.classList.toggle("show");
        e.stopPropagation();
        return;
    }

    // 2) 메뉴 아이템 클릭
    const actionBtn = e.target.closest(".menu-item");
    if (!actionBtn) return;

    const {action, id} = actionBtn.dataset;
    if (!action || !id) return;

    // === 리뷰 삭제 ===
    if (action === "delete-review") {
        if (!confirm("리뷰를 삭제하시겠습니까?")) return;

        const res = await fetch(`/api/me/reviews/${id}`, {method: "DELETE"});
        if (!res.ok) return alert("삭제 실패");

        actionBtn.closest(".modal-review-item")?.remove();
        closeAllMenus();
        return;
    }

    // === 리뷰 수정(인라인 편집) ===
    if (action === "edit-review") {
        const item = actionBtn.closest(".modal-review-item");
        if (!item) return;

        // 이미 편집 중이면 중복 방지
        if (item.querySelector(".edit-form")) {
            closeAllMenus();
            return;
        }

        const metaDiv = item.querySelector(".modal-review-meta");
        const bodyDiv = item.querySelector(".item-body");

        const originalText = bodyDiv?.textContent ?? "";
        const originalRating = item.dataset.rating === "" ? "" : item.dataset.rating; // "4.2"
        const originalSpoiler = item.dataset.spoiler === "true";

        // 인라인 편집 폼 생성 (평점: 실수, 소수점 1자리 입력)
        const form = document.createElement("div");
        form.className = "edit-form";
        form.innerHTML = `
          <div style="display:flex; gap:12px; align-items:center; margin:8px 0;">
            <label style="display:flex; gap:6px; align-items:center;">
              <span>별점</span>
              <input
                type="number"
                class="edit-rating"
                min="0"
                max="5"
                step="0.1"
                inputmode="decimal"
                placeholder="예: 4.2"
                style="width:84px;"
              />
            </label>

            <label style="display:flex; gap:6px; align-items:center;">
              <input type="checkbox" class="edit-spoiler" />
              <span>스포일러</span>
            </label>
          </div>

          <textarea class="edit-overall" rows="4" style="width:100%; box-sizing:border-box;"></textarea>

          <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
            <button type="button" class="edit-cancel">취소</button>
            <button type="button" class="edit-save">저장</button>
          </div>
        `;

        // 기존 텍스트 숨기고 폼 붙이기
        bodyDiv.style.display = "none";
        item.appendChild(form);

        // 초기값 세팅
        const ratingInput = form.querySelector(".edit-rating");
        const spoilerChk = form.querySelector(".edit-spoiler");
        const overallTa = form.querySelector(".edit-overall");

        ratingInput.value = originalRating === "" ? "" : String(Number(originalRating).toFixed(1));
        spoilerChk.checked = originalSpoiler;
        overallTa.value = originalText;

        // 취소
        form.querySelector(".edit-cancel").addEventListener("click", () => {
            form.remove();
            bodyDiv.style.display = "";
            closeAllMenus();
        });

        // 저장
        form.querySelector(".edit-save").addEventListener("click", async () => {
            const newOverall = overallTa.value.trim();
            const rawRating = ratingInput.value.trim();
            const newSpoiler = spoilerChk.checked;

            if (!newOverall) return alert("리뷰 내용은 비울 수 없습니다.");

            // rating: 비우면 null, 입력하면 0.0~5.0 소수 1자리로 강제
            let newRating = null;
            if (rawRating !== "") {
                const v = Number(rawRating);
                if (Number.isNaN(v)) return alert("별점은 숫자로 입력하세요.");
                if (v < 0 || v > 5) return alert("별점은 0.0 ~ 5.0 사이로 입력하세요.");
                newRating = Math.round(v * 10) / 10; // 소수 1자리로 정규화
            }

            const res = await fetch(`/api/me/reviews/${id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    overall: newOverall,
                    rating: newRating,
                    spoiler: newSpoiler,
                }),
            });

            if (!res.ok) return alert("수정 실패");

            // 화면 반영
            bodyDiv.textContent = newOverall;
            bodyDiv.style.display = "";
            form.remove();

            // dataset 갱신
            item.dataset.rating = newRating ?? "";
            item.dataset.spoiler = newSpoiler ? "true" : "false";

            // meta 표시 갱신(작성일 유지)
            if (metaDiv) {
                const old = metaDiv.textContent || "";
                const tail = old.includes("| 작성일:") ? old.split("| 작성일:")[1] : "";
                metaDiv.textContent =
                    `평점: ${newRating ?? "-"} | 스포일러: ${newSpoiler ? "O" : "X"}` +
                    (tail ? ` | 작성일: ${tail.trim()}` : "");
            }

            closeAllMenus();
        });

        closeAllMenus();
        return;
    }

    // === 코멘트 삭제 ===
    if (action === "delete-comment") {
        if (!confirm("코멘트를 삭제하시겠습니까?")) return;

        const res = await fetch(`/api/me/page-comments/${id}`, {method: "DELETE"});
        if (!res.ok) return alert("삭제 실패");

        actionBtn.closest(".modal-review-item")?.remove();
        closeAllMenus();
        return;
    }

    // === 코멘트 수정 ===
    if (action === "edit-comment") {
        const item = actionBtn.closest(".modal-review-item");
        if (!item) return;

        // 이미 편집 중이면 중복 방지
        if (item.querySelector(".edit-form")) {
            closeAllMenus();
            return;
        }

        const bodyDiv = item.querySelector(".item-body");
        const originalText = bodyDiv?.textContent ?? "";

        // 인라인 편집 폼 생성
        const form = document.createElement("div");
        form.className = "edit-form";
        form.innerHTML = `
            <textarea class="edit-comment" rows="3" style="width:100%; box-sizing:border-box;"></textarea>
            <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
              <button type="button" class="edit-cancel">취소</button>
              <button type="button" class="edit-save">저장</button>
            </div>
        `;

        // 기존 텍스트 숨기고 폼 붙이기
        bodyDiv.style.display = "none";
        item.appendChild(form);

        // 초기값
        const ta = form.querySelector(".edit-comment");
        ta.value = originalText;

        // 취소
        form.querySelector(".edit-cancel").addEventListener("click", () => {
            form.remove();
            bodyDiv.style.display = "";
            closeAllMenus();
        });

        // 저장
        form.querySelector(".edit-save").addEventListener("click", async () => {
            const newText = ta.value.trim();
            if (!newText) return alert("코멘트 내용은 비울 수 없습니다.");

            const res = await fetch(`/api/me/page-comments/${id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({comment: newText}),
            });
            if (!res.ok) return alert("수정 실패");

            // 화면 반영
            bodyDiv.textContent = newText;
            bodyDiv.style.display = "";
            form.remove();

            closeAllMenus();
        });

        closeAllMenus();
        return;
    }
});

// 모달 닫기
function closeModal() {
    document.getElementById("review-modal-backdrop")?.classList.remove("show");
    closeAllMenus();
}

// 열린 모든 케밥 메뉴 닫기
function closeAllMenus() {
    document
        .querySelectorAll(".menu-panel.show")
        .forEach((p) => p.classList.remove("show"));
}
