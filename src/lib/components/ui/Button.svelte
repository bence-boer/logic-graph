<script lang="ts">
    interface Props {
        onclick?: () => void;
        variant?: 'primary' | 'secondary' | 'danger';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        children: import('svelte').Snippet;
    }

    let {
        onclick,
        variant = 'secondary',
        size = 'md',
        disabled = false,
        children
    }: Props = $props();

    const base_classes =
        'inline-flex items-center justify-center gap-1.5 border rounded-md font-medium cursor-pointer transition-all duration-200 ease-in-out';

    const variant_classes = {
        primary:
            'bg-accent-600 border-accent-600 text-white hover:bg-accent-700 hover:border-accent-700',
        secondary:
            'bg-neutral-800 border-neutral-700 text-white hover:border-neutral-600 hover:bg-neutral-750',
        danger: 'bg-transparent border-red-500 text-red-500 hover:bg-red-500/10'
    };

    const size_classes = {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const disabled_classes = 'disabled:opacity-50 disabled:cursor-not-allowed';
    const active_classes = 'active:scale-[0.98]';

    const button_classes = `${base_classes} ${variant_classes[variant]} ${size_classes[size]} ${disabled_classes} ${active_classes}`;
</script>

<button class={button_classes} {onclick} {disabled}>
    {@render children()}
</button>
