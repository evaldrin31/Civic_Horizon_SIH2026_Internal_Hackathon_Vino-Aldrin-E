"""Initial database schema for Accessibility Intelligence Platform.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-17

This migration creates the foundational tables for the evidence-backed
accessibility intelligence platform.

Schema design decisions:
- String(36) UUID primary keys for cross-database compatibility (PostgreSQL + SQLite)
- Proper indexing for common query patterns
- Foreign key constraints with appropriate cascade rules
- Nullable coordinates in venue_locations (not all locations need precise coords)
- Enums stored as strings for SQLite compatibility (use native ENUM in PostgreSQL)
- Soft deletes not used; evidence preservation is explicit via verification states
- No computed confidence formula yet (see DECISIONS.md)

Note: This migration uses String-based UUIDs for cross-database compatibility.
For PostgreSQL production, consider using native UUID type.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Venues table - using String(36) for UUID compatibility
    op.create_table(
        'venues',
        sa.Column('venue_id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('state', sa.String(100), nullable=False),
        sa.Column('country', sa.String(100), nullable=False, server_default='India'),
        sa.Column('postal_code', sa.String(20), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('official_url', sa.String(500), nullable=True),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Indexes for venues
    op.create_index('idx_venue_name', 'venues', ['name'])
    op.create_index('idx_venue_category', 'venues', ['category'])
    op.create_index('idx_venue_city', 'venues', ['city'])
    op.create_index('idx_venue_state', 'venues', ['state'])
    op.create_index('idx_venue_location', 'venues', ['latitude', 'longitude'])
    op.create_index('idx_venue_category_city', 'venues', ['category', 'city'])
    
    # Venue locations table
    op.create_table(
        'venue_locations',
        sa.Column('location_id', sa.String(36), primary_key=True),
        sa.Column('venue_id', sa.String(36), sa.ForeignKey('venues.venue_id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('location_type', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('floor', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Index for venue_locations
    op.create_index('idx_location_venue', 'venue_locations', ['venue_id'])
    
    # Accessibility attributes table
    op.create_table(
        'accessibility_attributes',
        sa.Column('attribute_id', sa.String(36), primary_key=True),
        sa.Column('venue_id', sa.String(36), sa.ForeignKey('venues.venue_id', ondelete='CASCADE'), nullable=False),
        sa.Column('location_id', sa.String(36), sa.ForeignKey('venue_locations.location_id', ondelete='CASCADE'), nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('attribute_name', sa.String(100), nullable=False),
        sa.Column('value', sa.String(20), nullable=False, server_default='unknown'),  # yes/no/unknown/partial
        sa.Column('value_type', sa.String(50), nullable=True),
        sa.Column('value_text', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('last_observed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Indexes for accessibility_attributes
    op.create_index('idx_attr_venue', 'accessibility_attributes', ['venue_id'])
    op.create_index('idx_attr_location', 'accessibility_attributes', ['location_id'])
    op.create_index('idx_attr_category', 'accessibility_attributes', ['category'])
    op.create_index('idx_attr_name', 'accessibility_attributes', ['attribute_name'])
    op.create_index('idx_attr_venue_category', 'accessibility_attributes', ['venue_id', 'category'])
    op.create_index('idx_attr_name_value', 'accessibility_attributes', ['attribute_name', 'value'])
    
    # Sources table
    op.create_table(
        'sources',
        sa.Column('source_id', sa.String(36), primary_key=True),
        sa.Column('source_type', sa.String(50), nullable=False),  # government/professional_audit/etc
        sa.Column('source_name', sa.String(255), nullable=False),
        sa.Column('source_url', sa.String(500), nullable=True),
        sa.Column('source_reference', sa.String(500), nullable=True),
        sa.Column('contact_info', sa.Text(), nullable=True),
        sa.Column('license_info', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Index for sources
    op.create_index('idx_source_type', 'sources', ['source_type'])
    op.create_index('idx_source_name', 'sources', ['source_name'])
    
    # Evidence table
    op.create_table(
        'evidence',
        sa.Column('evidence_id', sa.String(36), primary_key=True),
        sa.Column('attribute_id', sa.String(36), sa.ForeignKey('accessibility_attributes.attribute_id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_id', sa.String(36), sa.ForeignKey('sources.source_id', ondelete='SET NULL'), nullable=True),
        sa.Column('evidence_text', sa.Text(), nullable=True),
        sa.Column('evidence_media_url', sa.String(500), nullable=True),
        sa.Column('evidence_media_hash', sa.String(64), nullable=True),
        sa.Column('observed_at', sa.DateTime(), nullable=True),
        sa.Column('collected_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('collector', sa.String(255), nullable=True),
        sa.Column('verification_status', sa.String(20), nullable=False, server_default='unverified'),  # unverified/reported/etc
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Indexes for evidence
    op.create_index('idx_evidence_attribute', 'evidence', ['attribute_id'])
    op.create_index('idx_evidence_source', 'evidence', ['source_id'])
    op.create_index('idx_evidence_status', 'evidence', ['verification_status'])
    op.create_index('idx_evidence_status_observed', 'evidence', ['verification_status', 'observed_at'])
    op.create_index('idx_evidence_source_collected', 'evidence', ['source_id', 'collected_at'])
    
    # Verification history table
    op.create_table(
        'verification_history',
        sa.Column('history_id', sa.String(36), primary_key=True),
        sa.Column('evidence_id', sa.String(36), sa.ForeignKey('evidence.evidence_id', ondelete='CASCADE'), nullable=False),
        sa.Column('previous_status', sa.String(20), nullable=True),
        sa.Column('new_status', sa.String(20), nullable=False),
        sa.Column('change_reason', sa.Text(), nullable=True),
        sa.Column('changed_by', sa.String(255), nullable=True),
        sa.Column('changed_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    
    # Index for verification_history
    op.create_index('idx_history_evidence', 'verification_history', ['evidence_id'])


def downgrade():
    # Drop tables in reverse order (respect foreign keys)
    op.drop_index('idx_history_evidence', table_name='verification_history')
    op.drop_table('verification_history')
    
    op.drop_index('idx_evidence_source_collected', table_name='evidence')
    op.drop_index('idx_evidence_status_observed', table_name='evidence')
    op.drop_index('idx_evidence_status', table_name='evidence')
    op.drop_index('idx_evidence_source', table_name='evidence')
    op.drop_index('idx_evidence_attribute', table_name='evidence')
    op.drop_table('evidence')
    
    op.drop_index('idx_source_name', table_name='sources')
    op.drop_index('idx_source_type', table_name='sources')
    op.drop_table('sources')
    
    op.drop_index('idx_attr_name_value', table_name='accessibility_attributes')
    op.drop_index('idx_attr_venue_category', table_name='accessibility_attributes')
    op.drop_index('idx_attr_name', table_name='accessibility_attributes')
    op.drop_index('idx_attr_category', table_name='accessibility_attributes')
    op.drop_index('idx_attr_location', table_name='accessibility_attributes')
    op.drop_index('idx_attr_venue', table_name='accessibility_attributes')
    op.drop_table('accessibility_attributes')
    
    op.drop_index('idx_location_venue', table_name='venue_locations')
    op.drop_table('venue_locations')
    
    op.drop_index('idx_venue_category_city', table_name='venues')
    op.drop_index('idx_venue_location', table_name='venues')
    op.drop_index('idx_venue_state', table_name='venues')
    op.drop_index('idx_venue_city', table_name='venues')
    op.drop_index('idx_venue_category', table_name='venues')
    op.drop_index('idx_venue_name', table_name='venues')
    op.drop_table('venues')
