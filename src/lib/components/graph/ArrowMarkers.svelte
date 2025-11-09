<script lang="ts">
    import { ConnectionType } from '$lib/types/graph';
    import { get_arrow_marker_id } from '$lib/utils/d3-helpers';
</script>

<defs>
    <!-- Arrow marker for implications (solid arrow) -->
    <marker
        id={get_arrow_marker_id(ConnectionType.IMPLICATION)}
        viewBox="0 0 10 10"
        refX="20"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
    >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--link-implication)" />
    </marker>

    <!-- Arrow marker for contradictions (double-headed arrow) -->
    <marker
        id={get_arrow_marker_id(ConnectionType.CONTRADICTION)}
        viewBox="0 0 10 10"
        refX="20"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
    >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--link-contradiction)" />
    </marker>

    <!-- Additional marker for contradiction (start marker) -->
    <marker
        id={`${get_arrow_marker_id(ConnectionType.CONTRADICTION)}-start`}
        viewBox="0 0 10 10"
        refX="-10"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
    >
        <path d="M 10 0 L 0 5 L 10 10 z" fill="var(--link-contradiction)" />
    </marker>
</defs>
