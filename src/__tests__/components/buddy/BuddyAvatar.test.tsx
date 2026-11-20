/**
 * BuddyAvatar 组件测试
 */

/// <reference lib="dom" />
/* eslint-disable no-undef */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../utils/render';
import assets from '@/data/emojiAssets.json';
import { BuddyAvatar } from '@/components/buddy/BuddyAvatar';
import type { BuddyStage, BuddyMood } from '@/services/buddyService';

describe('BuddyAvatar 组件', () => {
  const defaultProps = {
    stage: 2 as BuddyStage,
    mood: 'happy' as BuddyMood,
  };

  describe('渲染', () => {
    it('应该显示 Buddy 的 emoji', () => {
      render(<BuddyAvatar {...defaultProps} stage={2} />);
      // Stage 2 的 emoji 是 🐣
      expect(document.querySelector(`img[src$="${assets['🐣'][0]}"]`)).toBeInTheDocument();
    });

    it('不同阶段应该显示不同 emoji', () => {
      const { rerender } = render(<BuddyAvatar {...defaultProps} stage={1} />);
      expect(document.querySelector(`img[src$="${assets['🥚'][0]}"]`)).toBeInTheDocument();

      rerender(<BuddyAvatar {...defaultProps} stage={2} />);
      expect(document.querySelector(`img[src$="${assets['🐣'][0]}"]`)).toBeInTheDocument();

      rerender(<BuddyAvatar {...defaultProps} stage={3} />);
      expect(document.querySelector(`img[src$="${assets['🐲'][0]}"]`)).toBeInTheDocument();

      rerender(<BuddyAvatar {...defaultProps} stage={4} />);
      expect(document.querySelector(`img[src$="${assets['🌟'][0]}"]`)).toBeInTheDocument();
    });
  });

  describe('心情指示器', () => {
    it('应该显示心情 emoji', () => {
      render(<BuddyAvatar {...defaultProps} mood="happy" />);
      // happy mood emoji 是 😊
      expect(document.querySelector(`img[src$="${assets['😊'][0]}"]`)).toBeInTheDocument();
    });

    it('不同心情应该显示不同 emoji', () => {
      const { rerender } = render(<BuddyAvatar {...defaultProps} mood="happy" />);
      expect(document.querySelector(`img[src$="${assets['😊'][0]}"]`)).toBeInTheDocument();

      rerender(<BuddyAvatar {...defaultProps} mood="excited" />);
      expect(document.querySelector(`img[src$="${assets['🤩'][0]}"]`)).toBeInTheDocument();

      rerender(<BuddyAvatar {...defaultProps} mood="neutral" />);
      expect(document.querySelector(`img[src$="${assets['😐'][0]}"]`)).toBeInTheDocument();

      rerender(<BuddyAvatar {...defaultProps} mood="sad" />);
      expect(document.querySelector(`img[src$="${assets['😢'][0]}"]`)).toBeInTheDocument();

      rerender(<BuddyAvatar {...defaultProps} mood="sleepy" />);
      expect(document.querySelector(`img[src$="${assets['😴'][0]}"]`)).toBeInTheDocument();
    });
  });

  describe('尺寸', () => {
    it('应该接受不同尺寸 prop', () => {
      const { rerender, container } = render(<BuddyAvatar {...defaultProps} size="sm" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<BuddyAvatar {...defaultProps} size="md" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<BuddyAvatar {...defaultProps} size="lg" />);
      expect(container.firstChild).not.toBeNull();

      rerender(<BuddyAvatar {...defaultProps} size="xl" />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('交互', () => {
    it('点击应该触发 onClick', () => {
      const handleClick = vi.fn();
      const { container } = render(<BuddyAvatar {...defaultProps} onClick={handleClick} />);

      fireEvent.click(container.firstChild as Element);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('没有 onClick 时点击不应该报错', () => {
      const { container } = render(<BuddyAvatar {...defaultProps} />);
      expect(() => fireEvent.click(container.firstChild as Element)).not.toThrow();
    });
  });

  describe('对话气泡', () => {
    it('showBubble 为 true 且有文本时应该显示气泡', () => {
      render(<BuddyAvatar {...defaultProps} showBubble bubbleText="Hello!" />);
      expect(screen.getByText('Hello!')).toBeInTheDocument();
    });

    it('showBubble 为 false 时不应该显示气泡', () => {
      render(<BuddyAvatar {...defaultProps} showBubble={false} bubbleText="Hello!" />);
      expect(screen.queryByText('Hello!')).not.toBeInTheDocument();
    });

    it('使用 context 时应该显示自动生成的鼓励语', () => {
      render(<BuddyAvatar {...defaultProps} showBubble context="start" />);
      // 应该有某个鼓励语显示出来（内容是随机的）
      const bubble = document.querySelector('[class*="bubble"]');
      expect(bubble).not.toBeNull();
    });
  });

  describe('Props 验证', () => {
    it('应该接受 animated prop', () => {
      const { container } = render(<BuddyAvatar {...defaultProps} animated={true} />);
      expect(container.firstChild).not.toBeNull();
    });

    it('animated 为 false 时也应该正常渲染', () => {
      const { container } = render(<BuddyAvatar {...defaultProps} animated={false} />);
      expect(container.firstChild).not.toBeNull();
    });
  });
});
