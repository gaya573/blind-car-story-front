import React, { useEffect, useState } from 'react';
import styles from './WonderBlogSection.module.css';

const cards = new Array(8).fill(0).map((_, i) => ({
  id: i,
  title: i % 2 === 0 ? '신차장기렌트\n기본 필독' : 'EV9\n특정 정리 + 보조금\n7인승',
  img: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&h=600&fit=crop'
}));

export default function WonderBlogSection() {
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const evaluate = () => {
      const w = window.innerWidth;
      if (w <= 640) return setCols(1);
      if (w <= 1080) return setCols(2);
      if (w <= 1440) return setCols(3);
      return setCols(4);
    };
    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  const visibleCards = cards.slice(0, cols * 2);

  return (
    <section className={styles['wg-blog']}>
      <div className={styles['wg-blog-header']}>
        <h2 className={styles['wg-blog-title']}>블라인드 카스토리 블로그</h2>
        <p className={styles['wg-blog-subtitle']}>차량 리뷰와 딜을 블로그에서 확인하세요</p>
      </div>

      <div className={styles['wg-blog-grid']}>
        {visibleCards.map((card) => (
          <article key={card.id} className={styles['wg-blog-card']}>
            <div className={styles['wg-blog-card-image']}>
              <img src={card.img} alt="블로그 포스트" />
            </div>
            <div className={styles['wg-blog-card-overlay']}>
              <h3 className={styles['wg-blog-card-title']} dangerouslySetInnerHTML={{__html: card.title.replace(/\n/g, '<br />')}} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}


