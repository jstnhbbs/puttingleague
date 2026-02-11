'use client'

import { useState } from 'react'
import { gamebreakerCards } from '../data/gamebreaker-cards'
import styles from './page.module.css'

export default function GameBreakerPage() {
  const [flipped, setFlipped] = useState<Set<string>>(new Set())

  const handleCardClick = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>GameBreaker Cards</h1>
        <p className={styles.subtitle}>Click a card to flip and read the description</p>
        <div className={styles.grid}>
          {gamebreakerCards.map((card) => (
            <div
              key={card.id}
              className={`${styles.cardWrapper} ${flipped.has(card.id) ? styles.flipped : ''}`}
              onClick={() => handleCardClick(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardClick(card.id)
                }
              }}
              aria-label={`${card.title}, click to ${flipped.has(card.id) ? 'show front' : 'show description'}`}
            >
              <div className={styles.cardInner}>
                <div className={styles.cardFront}>
                  <div className={styles.imageWrap}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={card.title}
                      className={styles.cardImage}
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.background = 'var(--card-placeholder-bg, #e0e0e0)'
                        target.alt = `${card.title} (image not found)`
                      }}
                    />
                  </div>
                  <span className={styles.cardTitle}>{card.title}</span>
                </div>
                <div className={styles.cardBack}>
                  <span className={styles.cardBackTitle}>{card.title}</span>
                  <p className={styles.cardDescription}>{card.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
