'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import styles from './Navbar.module.css'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            Putting League
          </Link>
        </div>
        <div className={styles.right}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link
            href="/rules"
            className={`${styles.navLink} ${pathname === '/rules' ? styles.active : ''}`}
          >
            Rules
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
