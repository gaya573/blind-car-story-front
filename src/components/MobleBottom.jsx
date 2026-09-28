import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import MobileBottomNav from './navigation/MobileBottomNav.jsx';
import MobileContactModal from './MobileContactModal.jsx';
import ConsultSuccessModal from './ConsultSuccessModal.jsx';
import { submitConsult, ensureConsultContact } from '../services/consultHelper.js';
import { handleKakaoPopupBlocked } from '../utils/kakaoPopup';
import { getStoredUserPhone, setStoredUserPhone } from '../utils/phoneStorage';
import styles from './MobleBottom.module.css';

const assetPath = (file) => encodeURI(`/bottom/${file}`);
const BottomIcon = ({ name, alt }) => (
  <img src={assetPath(name)} alt={alt} loading="lazy" />
  );

function MobleBottom() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeBottom, setActiveBottom] = useState(null);
    
    // 메인 페이지 여부 (/m 또는 /m/ 모두 허용)
    const isMainPage = location.pathname === '/m' || location.pathname === '/m/';
    
    // 연락처 모달 상태
    const [contactModalConfig, setContactModalConfig] = useState(null);
    const [isContactSubmitting, setIsContactSubmitting] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    useEffect(() => {
        // 정확히 메인 페이지일 때만 활성화
        if (location.pathname === '/m' || location.pathname === '/m/') {
            setActiveBottom('홈');
        } else if (location.pathname === '/m/search') {
            setActiveBottom('차량검색');
        } else if (location.pathname === '/m/advance' || location.pathname === '/m/advance/all') {
            setActiveBottom('즉시출고');
        } else if (location.pathname === '/m/brand') {
            setActiveBottom('선구매할인');
        } else {
            // 그 외 경로(/m/car-detail, /m/search/find 등)는 아무것도 활성화 안 함
            setActiveBottom(null);
        }
    }, [location.pathname]);

    // 연락처 모달 열기
    const openContactModal = useCallback((payload, options = {}, extraConfig = {}) => {
        setContactModalConfig({
            payload,
            options: {
                initialPhone: options.initialPhone || '',
                openKakaoOnSuccess: options.openKakaoOnSuccess || false,
                kakaoOpenTarget: options.kakaoOpenTarget || '_blank',
                useKakao: options.useKakao || false,
            },
            successMessage: extraConfig.successMessage || '상담 신청이 접수되었습니다.',
        });
    }, []);

    // 연락처 모달 제출
    const handleContactModalSubmit = useCallback(
        async (phoneValue) => {
            if (!contactModalConfig) return;
            const phone = (phoneValue || '').trim();
            if (!phone) {
                alert('연락처를 입력해 주세요.');
                return;
            }

            setIsContactSubmitting(true);
            try {
                const result = await submitConsult(
                    { ...contactModalConfig.payload, phone },
                    contactModalConfig.options,
                );

                if (result.success) {
                    setStoredUserPhone(phone);
                    setContactModalConfig(null);
                    setIsSuccessModalOpen(true);
                    handleKakaoPopupBlocked(result);
                } else if (result?.meta?.phoneMissing) {
                    alert('연락처를 다시 확인해 주세요.');
                } else {
                    alert(result.message || '연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
                }
            } catch (error) {
                console.error('[MobleBottom] 연락처 등록 실패', error);
                alert('연락처 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
            } finally {
                setIsContactSubmitting(false);
            }
        },
        [contactModalConfig],
    );

    // 카카오 상담 전송
    const sendKakaoConsult = useCallback(
        async (payload) => {
            try {
                const result = await submitConsult(payload, {
                    kakaoOpenTarget: '_blank',
                    openKakaoOnSuccess: true,
                    useKakao: false,
                });

                if (result.success) {
                    if (payload.phone) {
                        setStoredUserPhone(payload.phone);
                    }
                    setIsSuccessModalOpen(true);
                    handleKakaoPopupBlocked(result, {
                        onNeedContact: () => {
                            openContactModal(
                                { ...payload, phone: '' },
                                {
                                    initialPhone: '',
                                    openKakaoOnSuccess: true,
                                    kakaoOpenTarget: '_blank',
                                    useKakao: false,
                                },
                                {
                                    successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
                                },
                            );
                        },
                    });
                } else {
                    alert(result.message || '카카오톡으로 연결하는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
                }
            } catch (error) {
                console.error('[MobleBottom] 카카오 상담 전송 실패', error);
                alert('카카오톡으로 연결하는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        },
        [openContactModal],
    );

    // 연락처남기기 버튼 클릭
    const handleContactButtonClick = useCallback(async () => {
        const basePayload = {
            consultType: '연락처상담',
            source: 'bottom-nav',
            entryLabel: '모바일 / 하단메뉴 / 연락처남기기',
            model: '모바일 하단메뉴 연락처상담',
        };

        try {
            const savedPhone = getStoredUserPhone();
            const savedName = localStorage.getItem('wgl_user_name');

            if (savedPhone) {
                await submitConsult({
                    ...basePayload,
                    phone: savedPhone,
                    name: savedName || '',
                });
                setIsSuccessModalOpen(true);
                return;
            }

            openContactModal(
                basePayload,
                {
                    initialPhone: '',
                    openKakaoOnSuccess: false,
                    useKakao: false,
                },
                {
                    successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
                },
            );
        } catch (error) {
            console.error('[MobleBottom] 연락처 버튼 처리 실패', error);
            openContactModal(
                basePayload,
                {
                    initialPhone: '',
                    openKakaoOnSuccess: false,
                    useKakao: false,
                },
                {
                    successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
                },
            );
        }
    }, [openContactModal]);

    // 카카오톡 버튼 클릭
    const handleKakaoButtonClick = useCallback(async () => {
        const basePayload = {
            consultType: '카카오상담',
            source: 'bottom-nav',
            entryLabel: '모바일 / 하단메뉴 / 카카오톡',
            model: '모바일 하단메뉴 카카오상담',
        };

        try {
            const savedPhone = getStoredUserPhone();
            const savedName = localStorage.getItem('wgl_user_name');

            if (savedPhone) {
                await sendKakaoConsult({
                    ...basePayload,
                    phone: savedPhone,
                    name: savedName || '',
                });
                return;
            }

            // [카카오톡 버튼 전용] 카카오 로그인 기능 유지
            const contactInfo = await ensureConsultContact(basePayload, {
                useKakao: true,
                requirePhone: false,
            });
            const enrichedPayload = contactInfo?.data ?? basePayload;

            if (!contactInfo?.phoneMissing && enrichedPayload.phone) {
                await sendKakaoConsult(enrichedPayload);
                return;
            }

            openContactModal(
                basePayload,
                {
                    initialPhone: '',
                    openKakaoOnSuccess: true,
                    kakaoOpenTarget: '_blank',
                    useKakao: false,
                },
                {
                    successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
                },
            );
        } catch (error) {
            console.error('[MobleBottom] 카카오 버튼 처리 실패', error);
            openContactModal(
                basePayload,
                {
                    initialPhone: '',
                    openKakaoOnSuccess: true,
                    kakaoOpenTarget: '_blank',
                    useKakao: false,
                },
                {
                    successMessage: '상담 신청이 접수되었습니다. 곧 상담사가 연락드립니다.',
                },
            );
        }
    }, [openContactModal, sendKakaoConsult]);

    // 메인 페이지용 하단 메뉴: 홈, 연락처남기기, 카톡문의, 즉시출고
    const mainPageBottomItems = [
        {
            key: '홈',
            label: '홈',
            icon: (
                <BottomIcon
                    name="홈_main.svg"
                    alt="홈"
                />
            ),
        },
        {
            key: '연락처남기기',
            label: '연락처남기기',
            icon: (
                <BottomIcon
                    name="전화걸기.svg"
                    alt="연락처남기기"
                />
            ),
        },
        {
            key: '카톡문의',
            label: '카톡문의',
            icon: (
                <BottomIcon
                    name="카톡문의.svg"
                    alt="카톡문의"
                />
            ),
        },
        {
            key: '즉시출고_main',
            label: '즉시출고',
            icon: (
                <BottomIcon
                    name="로켓.svg"
                    alt="즉시출고"
                />
            ),
        },
    ];

    // 일반 페이지용 하단 메뉴: 홈, 차량검색, 재고 특가, 브랜드별 혜택
    const defaultBottomItems = [
        {
            key: '홈',
            label: '홈',
            icon: (
                <BottomIcon
                    name={activeBottom === '홈' ? '홈_fill.svg' : '홈.svg'}
                    alt="홈"
                />
            ),
        },
        {
            key: '차량검색',
            label: '차량검색',
            icon: (
                <BottomIcon
                    name={activeBottom === '차량검색' ? '차량검색_fill.svg' : '차량검색.svg'}
                    alt="차량검색"
                />
            ),
        },
        {
            key: '즉시출고',
            label: '재고 특가',
            icon: (
                <BottomIcon
                    name={activeBottom === '즉시출고' ? '즉시출고_fill.svg' : '즉시출고.svg'}
                    alt="재고 특가"
                />
            ),
        },
        {
            key: '선구매할인',
            label: '브랜드별 혜택',
            icon: (
                <BottomIcon
                    name={activeBottom === '선구매할인' ? '선구매핫딜_fill.svg' : '선구매할인.svg'}
                    alt="브랜드별 혜택"
                />
            ),
        },
    ];

    // 메인 페이지일 때와 아닐 때 다른 아이템 사용
    const bottomItems = isMainPage ? mainPageBottomItems : defaultBottomItems;

    const handleSelect = (key) => {
        setActiveBottom(key);
        
        // 메인 페이지용 메뉴 동작
        if (key === '연락처남기기') {
            handleContactButtonClick();
        } else if (key === '카톡문의') {
            handleKakaoButtonClick();
        } else if (key === '즉시출고_main') {
            navigate('/m/advance');
        } else if (key === '홈' && isMainPage) {
            navigate('/m/v2');
        }
        // 일반 메뉴 동작
        else if (key === '차량검색') {
            navigate('/m/search');
        } else if (key === '홈') {
            navigate('/m');
        } else if (key === '즉시출고') {
            navigate('/m/advance');
        } else if (key === '선구매할인') {
            navigate('/m/brand');
        }
    };

    return (
        <>
            <div className={styles.bottom}>
                <MobileBottomNav
                    items={bottomItems}
                    activeKey={activeBottom}
                    onSelect={handleSelect}
                />
            </div>

            {/* 연락처 입력 모달 */}
            <MobileContactModal
                open={Boolean(contactModalConfig)}
                onClose={() => setContactModalConfig(null)}
                onSubmit={handleContactModalSubmit}
                isSubmitting={isContactSubmitting}
                initialPhone={contactModalConfig?.options?.initialPhone || ''}
            />

            {/* 성공 모달 */}
            <ConsultSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
            />
        </>
    );
}

export { MobleBottom }