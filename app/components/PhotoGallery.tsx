'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Select, Input, Modal, Upload, Form, message, Spin, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons';
import { Photo } from '../lib/dynamodb';
import { PhotoAPI } from '../lib/photo-api';

const { Meta } = Card;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

interface PhotoGalleryProps {
    initialPhotos?: Photo[];
}

export default function PhotoGallery({ initialPhotos = [] }: PhotoGalleryProps) {
    const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
    const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>(initialPhotos);
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [searchText, setSearchText] = useState('');

    // Modal states
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    // Form
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();

    // Load photos and tags on component mount
    useEffect(() => {
        loadPhotos();
        loadTags();
    }, []);

    // Filter photos when search or tag changes
    useEffect(() => {
        filterPhotos();
    }, [photos, selectedTag, searchText]);

    const loadPhotos = async () => {
        try {
            setLoading(true);
            const response = await PhotoAPI.getPhotos();
            setPhotos(response.photos);
        } catch (error) {
            message.error('Failed to load photos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadTags = async () => {
        try {
            const allTags = await PhotoAPI.getTags();
            setTags(allTags);
        } catch (error) {
            console.error('Failed to load tags:', error);
        }
    };

    const filterPhotos = () => {
        let filtered = photos;

        if (selectedTag) {
            filtered = filtered.filter(photo => photo.tags.includes(selectedTag));
        }

        if (searchText) {
            const search = searchText.toLowerCase();
            filtered = filtered.filter(photo =>
                photo.originalName.toLowerCase().includes(search) ||
                photo.description?.toLowerCase().includes(search) ||
                photo.tags.some(tag => tag.toLowerCase().includes(search))
            );
        }

        setFilteredPhotos(filtered);
    };

    const handleUpload = async (values: any) => {
        const { file, tags: uploadTags, description } = values;

        try {
            setLoading(true);
            const photo = await PhotoAPI.uploadPhoto(file, uploadTags || [], description);
            setPhotos(prev => [photo, ...prev]);
            setUploadModalVisible(false);
            form.resetFields();
            message.success('Photo uploaded successfully!');
            await loadTags(); // Refresh tags
        } catch (error: any) {
            message.error(error.message || 'Failed to upload photo');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (values: any) => {
        if (!selectedPhoto) return;

        try {
            setLoading(true);
            const updatedPhoto = await PhotoAPI.updatePhoto(selectedPhoto.id, values);
            setPhotos(prev => prev.map(p => p.id === selectedPhoto.id ? updatedPhoto : p));
            setEditModalVisible(false);
            setSelectedPhoto(null);
            editForm.resetFields();
            message.success('Photo updated successfully!');
            await loadTags(); // Refresh tags
        } catch (error: any) {
            message.error(error.message || 'Failed to update photo');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (photo: Photo) => {
        Modal.confirm({
            title: 'Delete Photo',
            content: 'Are you sure you want to delete this photo? This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    setLoading(true);
                    await PhotoAPI.deletePhoto(photo.id);
                    setPhotos(prev => prev.filter(p => p.id !== photo.id));
                    message.success('Photo deleted successfully!');
                    await loadTags(); // Refresh tags
                } catch (error: any) {
                    message.error(error.message || 'Failed to delete photo');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const openEditModal = (photo: Photo) => {
        setSelectedPhoto(photo);
        editForm.setFieldsValue({
            tags: photo.tags,
            description: photo.description,
        });
        setEditModalVisible(true);
    };

    const openPreviewModal = (photo: Photo) => {
        setSelectedPhoto(photo);
        setPreviewModalVisible(true);
    };

    return (
        <div className="photo-gallery p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Photo Gallery</h1>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setUploadModalVisible(true)}
                    >
                        Upload Photo
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    <Input.Search
                        placeholder="Search photos..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                    />
                    <Select
                        placeholder="Filter by tag"
                        value={selectedTag}
                        onChange={setSelectedTag}
                        allowClear
                        style={{ width: 200 }}
                    >
                        {tags.map(tag => (
                            <Option key={tag} value={tag}>{tag}</Option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Photos Grid */}
            <Spin spinning={loading}>
                {filteredPhotos.length === 0 ? (
                    <Empty description="No photos found" />
                ) : (
                    <Row gutter={[16, 16]}>
                        {filteredPhotos.map(photo => (
                            <Col key={photo.id} xs={24} sm={12} md={8} lg={6}>
                                <Card
                                    hoverable
                                    cover={
                                        <div className="relative">
                                            <img
                                                alt={photo.originalName}
                                                src={photo.s3Url}
                                                className="w-full h-48 object-cover"
                                                onClick={() => openPreviewModal(photo)}
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <Button
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => openPreviewModal(photo)}
                                                />
                                                <Button
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={() => openEditModal(photo)}
                                                />
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDelete(photo)}
                                                />
                                            </div>
                                        </div>
                                    }
                                >
                                    <Meta
                                        title={photo.originalName}
                                        description={
                                            <div>
                                                {photo.description && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {photo.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-1">
                                                    {photo.tags.map(tag => (
                                                        <Tag key={tag}>{tag}</Tag>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(photo.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Spin>

            {/* Upload Modal */}
            <Modal
                title="Upload Photo"
                open={uploadModalVisible}
                onCancel={() => {
                    setUploadModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form form={form} onFinish={handleUpload} layout="vertical">
                    <Form.Item
                        name="file"
                        label="Photo"
                        rules={[{ required: true, message: 'Please select a photo' }]}
                    >
                        <Dragger
                            accept="image/*"
                            beforeUpload={() => false}
                            maxCount={1}
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">Click or drag photo to this area to upload</p>
                            <p className="ant-upload-hint">Support for single photo upload only</p>
                        </Dragger>
                    </Form.Item>

                    <Form.Item name="tags" label="Tags">
                        <Select
                            mode="tags"
                            placeholder="Add tags"
                            options={tags.map(tag => ({ label: tag, value: tag }))}
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} placeholder="Optional description" />
                    </Form.Item>

                    <Form.Item>
                        <div className="flex gap-2">
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Upload
                            </Button>
                            <Button
                                onClick={() => {
                                    setUploadModalVisible(false);
                                    form.resetFields();
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Photo"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setSelectedPhoto(null);
                    editForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form form={editForm} onFinish={handleEdit} layout="vertical">
                    <Form.Item name="tags" label="Tags">
                        <Select
                            mode="tags"
                            placeholder="Add tags"
                            options={tags.map(tag => ({ label: tag, value: tag }))}
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <TextArea rows={3} placeholder="Optional description" />
                    </Form.Item>

                    <Form.Item>
                        <div className="flex gap-2">
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Update
                            </Button>
                            <Button
                                onClick={() => {
                                    setEditModalVisible(false);
                                    setSelectedPhoto(null);
                                    editForm.resetFields();
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Preview Modal */}
            <Modal
                title={selectedPhoto?.originalName}
                open={previewModalVisible}
                onCancel={() => {
                    setPreviewModalVisible(false);
                    setSelectedPhoto(null);
                }}
                footer={null}
                width={800}
                centered
            >
                {selectedPhoto && (
                    <div>
                        <img
                            src={selectedPhoto.s3Url}
                            alt={selectedPhoto.originalName}
                            className="w-full max-h-96 object-contain mb-4"
                        />
                        {selectedPhoto.description && (
                            <p className="mb-3">{selectedPhoto.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-3">
                            {selectedPhoto.tags.map(tag => (
                                <Tag key={tag}>{tag}</Tag>
                            ))}
                        </div>
                        <div className="text-sm text-gray-500">
                            <p>Size: {Math.round(selectedPhoto.size / 1024)} KB</p>
                            <p>Uploaded: {new Date(selectedPhoto.uploadedAt).toLocaleString()}</p>
                            {selectedPhoto.updatedAt !== selectedPhoto.uploadedAt && (
                                <p>Updated: {new Date(selectedPhoto.updatedAt).toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
} 