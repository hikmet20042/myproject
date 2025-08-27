'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  TextArea,
  Select,
  Card,
  CardHeader,
  CardContent,
  Container,
  Grid,
  GridItem,
  Alert,
  Loading,
  FormSection,
  DynamicList
} from '@/components';
import { Send, User, Mail, FileText, Plus } from 'lucide-react';

export default function ComponentDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    category: ''
  });
  const [items, setItems] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const categoryOptions = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Support Request' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'partnership', label: 'Partnership' }
  ];

  return (
    <Container size="lg" padding="lg">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Component Library Demo
          </h1>
          <p className="text-lg text-gray-600">
            Showcasing the consistent design system across the website
          </p>
        </div>

        {/* Alert Demo */}
        {showAlert && (
          <Alert
            variant="info"
            title="Component Library"
            dismissible
            onDismiss={() => setShowAlert(false)}
          >
            This page demonstrates the reusable components that ensure design consistency across the website.
          </Alert>
        )}

        {/* Button Variants */}
        <Card>
          <CardHeader
            gradient
            title="Button Components"
            description="Various button styles and states"
            icon={Plus}
          />
          <CardContent>
            <Grid cols={2} gap="md" responsive={{ sm: 1, md: 2 }}>
              <GridItem>
                <div className="space-y-4">
                  <Button variant="primary" icon={Send}>
                    Primary Button
                  </Button>
                  <Button variant="secondary" fullWidth>
                    Secondary Button
                  </Button>
                  <Button variant="outline" size="sm">
                    Outline Small
                  </Button>
                </div>
              </GridItem>
              <GridItem>
                <div className="space-y-4">
                  <Button variant="add" icon={Plus}>
                    Add Item
                  </Button>
                  <Button variant="danger" size="lg">
                    Danger Large
                  </Button>
                  <Button loading disabled>
                    Loading State
                  </Button>
                </div>
              </GridItem>
            </Grid>
          </CardContent>
        </Card>

        {/* Form Components */}
        <FormSection
          title="Contact Form"
          description="Example form using the component library"
          icon={Mail}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <Grid cols={2} gap="lg" responsive={{ sm: 1, md: 2 }}>
              <GridItem>
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  icon={User}
                  variant="indigo"
                  required
                />
              </GridItem>
              <GridItem>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  icon={Mail}
                  variant="purple"
                  required
                />
              </GridItem>
            </Grid>

            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              options={categoryOptions}
              placeholder="Select a category"
              variant="orange"
              required
            />

            <TextArea
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter your message here..."
              rows={6}
              variant="indigo"
              required
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={Send}
                loading={loading}
                size="lg"
              >
                Send Message
              </Button>
            </div>
          </form>
        </FormSection>

        {/* Dynamic List Demo */}
        <FormSection
          title="Dynamic List Example"
          description="Add and remove items dynamically"
          icon={FileText}
          gradientFrom="indigo-600"
          gradientTo="purple-800"
        >
          <DynamicList
            items={items}
            onChange={setItems}
            placeholder="Enter a list item..."
            addButtonText="Add Another Item"
            variant="purple"
            maxItems={5}
          />
        </FormSection>

        {/* Loading States */}
        <Card>
          <CardHeader
            title="Loading Components"
            description="Different loading states and sizes"
          />
          <CardContent>
            <Grid cols={3} gap="lg" responsive={{ sm: 1, md: 3 }}>
              <GridItem>
                <div className="text-center space-y-4">
                  <h4 className="font-semibold">Spinner</h4>
                  <Loading size="lg" variant="spinner" color="primary" />
                </div>
              </GridItem>
              <GridItem>
                <div className="text-center space-y-4">
                  <h4 className="font-semibold">Dots</h4>
                  <Loading size="lg" variant="dots" color="primary" />
                </div>
              </GridItem>
              <GridItem>
                <div className="text-center space-y-4">
                  <h4 className="font-semibold">With Text</h4>
                  <Loading size="md" text="Loading..." color="primary" />
                </div>
              </GridItem>
            </Grid>
          </CardContent>
        </Card>

        {/* Alert Variants */}
        <Card>
          <CardHeader
            title="Alert Components"
            description="Different alert types for user feedback"
          />
          <CardContent>
            <div className="space-y-4">
              <Alert variant="success" title="Success">
                Your action was completed successfully!
              </Alert>
              <Alert variant="warning" title="Warning">
                Please review your information before proceeding.
              </Alert>
              <Alert variant="error" title="Error">
                Something went wrong. Please try again.
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}