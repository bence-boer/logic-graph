<script lang="ts">
    interface Props {
        on_click?: () => void;
        variant?: 'primary' | 'secondary' | 'danger';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        icon?: boolean;
        class?: string;
        children: import('svelte').Snippet;
    }

    let {
        on_click,
        variant = 'secondary',
        size = 'md',
        disabled = false,
        icon = false,
        class: additional_classes = '',
        children
    }: Props = $props();

    const base_classes = icon
        ? 'inline-flex items-center justify-center border rounded-md transition-all duration-200 ease-in-out cursor-pointer'
        : 'inline-flex items-center justify-center gap-1.5 border rounded-md font-medium transition-all duration-200 ease-in-out cursor-pointer';

    const variant_classes = {
        primary:
            'bg-accent-600 border-accent-600 text-white hover:enabled:bg-accent-500 hover:enabled:border-accent-500',
        secondary:
            'bg-neutral-800 border-neutral-700 text-white hover:enabled:bg-neutral-600 hover:enabled:border-neutral-600',
        danger: icon
            ? 'border-transparent bg-transparent text-red-500 hover:enabled:border-transparent hover:enabled:bg-red-500/10'
            : 'bg-transparent border-red-500 text-red-500 hover:enabled:bg-red-500/10 hover:enabled:border-red-500'
    };

    const neutral_icon_classes =
        'border-transparent bg-transparent text-(--text-primary) hover:enabled:border-transparent hover:enabled:bg-neutral-700';

    const size_classes = {
        sm: icon ? 'p-1.5' : 'px-2.5 py-1.5 text-xs',
        md: icon ? 'p-2' : 'px-4 py-2 text-sm',
        lg: icon ? 'p-2.5' : 'px-6 py-3 text-base'
    };

    const disabled_classes = 'disabled:opacity-50 disabled:cursor-default';
    const active_classes = 'active:enabled:scale-[0.98]';

    const variant_style =
        icon && variant === 'secondary' ? neutral_icon_classes : variant_classes[variant];

    const button_classes = `${base_classes} ${variant_style} ${size_classes[size]} ${disabled_classes} ${active_classes} ${additional_classes}`;
</script>

<button class={button_classes} onclick={on_click} {disabled}>
    {@render children()}
</button>
